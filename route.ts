import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limiter';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const BUILD_SYSTEM_PROMPT = `You are Tahir GPT Build Mode — an expert full-stack developer and product architect.
When given a build request, you MUST respond with a structured JSON object (and nothing else) in this exact format:

{
  "title": "Project Title",
  "description": "Brief description",
  "steps": [
    { "step": 1, "title": "Step title", "description": "What to do", "duration": "5 min" }
  ],
  "folderStructure": "ASCII folder tree",
  "files": [
    { "path": "filename.ext", "language": "typescript", "content": "file contents here", "description": "What this file does" }
  ],
  "techStack": ["Next.js", "Tailwind CSS"],
  "deployInstructions": "Step by step deployment guide",
  "envVariables": [
    { "key": "DATABASE_URL", "description": "PostgreSQL connection string", "required": true }
  ]
}

Generate REAL, working code. Be thorough. Include all essential files.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    const { data: profile } = await supabase
      .from('profiles').select('plan').eq('id', userId).single();

    const rateCheck = checkRateLimit(`build_${userId}`, profile?.plan ?? 'free');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    let buildResult: any;

    try {
      // Try Gemini first (better at structured JSON)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Build request: ${prompt}\n\nRespond with ONLY the JSON object, no markdown, no explanation.` }] }],
        systemInstruction: BUILD_SYSTEM_PROMPT,
      });

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) buildResult = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback to OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: BUILD_SYSTEM_PROMPT },
          { role: 'user', content: `Build request: ${prompt}\n\nRespond with ONLY the JSON object.` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      });
      buildResult = JSON.parse(completion.choices[0].message.content!);
    }

    await supabase.rpc('increment_usage', { uid: userId });

    return NextResponse.json(buildResult);
  } catch (err: any) {
    console.error('Build API error:', err);
    return NextResponse.json({ error: err.message || 'Build failed' }, { status: 500 });
  }
}
