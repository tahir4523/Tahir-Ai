import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { routeQuery, isBuildRequest } from '@/lib/ai-router';
import { checkRateLimit } from '@/lib/rate-limiter';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are Tahir GPT — an advanced, intelligent AI assistant. 
You are helpful, knowledgeable, and respond with depth and precision.
Format responses using markdown when appropriate (code blocks, lists, headers).
Be concise when the question is simple, thorough when it is complex.`;

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, usage_count')
      .eq('id', userId)
      .single();

    const plan = profile?.plan ?? 'free';

    // Rate limit check
    const rateCheck = checkRateLimit(userId, plan);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Upgrade to Pro for more requests.' },
        {
          status: 429,
          headers: { 'X-RateLimit-Reset': String(rateCheck.resetAt) },
        }
      );
    }

    const body = await req.json();
    const { messages, mode = 'auto', conversationId } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]?.content ?? '';
    const decision = routeQuery(lastMessage, mode, plan);

    // Free plan → force nano
    const effectiveDecision = plan === 'free' ? { ...decision, model: 'gpt-4o-mini', provider: 'openai' as const } : decision;

    // Save user message
    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: lastMessage,
        model_used: effectiveDecision.model,
      });
    }

    // Increment usage
    await supabase.rpc('increment_usage', { uid: userId });

    // Stream response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';

          if (effectiveDecision.provider === 'openai') {
            const chatMessages = messages.map((m: any) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }));

            const completion = await openai.chat.completions.create({
              model: effectiveDecision.model,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...chatMessages,
              ],
              stream: true,
              max_tokens: mode === 'nano' ? 1000 : 4000,
              temperature: 0.7,
            });

            for await (const chunk of completion) {
              const text = chunk.choices[0]?.delta?.content ?? '';
              if (text) {
                fullResponse += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, mode: effectiveDecision.mode, provider: 'openai' })}\n\n`));
              }
            }
          } else {
            // Gemini
            const model = genAI.getGenerativeModel({ model: effectiveDecision.model });
            const geminiMessages = messages.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            }));

            const result = await model.generateContentStream({
              contents: geminiMessages,
              systemInstruction: SYSTEM_PROMPT,
            });

            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                fullResponse += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, mode: effectiveDecision.mode, provider: 'gemini' })}\n\n`));
              }
            }
          }

          // Save assistant message
          if (conversationId && fullResponse) {
            await supabase.from('messages').insert({
              conversation_id: conversationId,
              user_id: userId,
              role: 'assistant',
              content: fullResponse,
              model_used: effectiveDecision.model,
            });
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Model': effectiveDecision.model,
        'X-Provider': effectiveDecision.provider,
      },
    });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
