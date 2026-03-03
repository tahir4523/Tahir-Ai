import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limiter';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    // Check plan (image gen is Pro only)
    const { data: profile } = await supabase
      .from('profiles').select('plan').eq('id', userId).single();

    if (profile?.plan !== 'pro') {
      return NextResponse.json({ error: 'Image generation requires Pro plan' }, { status: 403 });
    }

    const rateCheck = checkRateLimit(`img_${userId}`, 'pro');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { prompt, size = '1024x1024', quality = 'standard' } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
      response_format: 'url',
    });

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt;

    // Increment usage
    await supabase.rpc('increment_usage', { uid: userId });

    return NextResponse.json({ imageUrl, revisedPrompt });
  } catch (err: any) {
    console.error('Image API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate image' }, { status: 500 });
  }
}
