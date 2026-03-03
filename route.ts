// app/api/image-gen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { checkAndIncrementUsage } from '@/lib/rate-limit';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, size = '1024x1024', quality = 'standard' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // Rate limit images
    const usageCheck = await checkAndIncrementUsage(user.id, 'image');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Monthly image limit reached',
          resetAt: usageCheck.resetAt,
          limit: usageCheck.limit,
        },
        { status: 429 }
      );
    }

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

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    // Save to DB
    await supabase.from('generated_images').insert({
      user_id: user.id,
      prompt,
      revised_prompt: revisedPrompt,
      image_url: imageUrl,
      size,
      quality,
    });

    return NextResponse.json({
      imageUrl,
      revisedPrompt,
      remaining: usageCheck.remaining,
    });
  } catch (err) {
    console.error('Image gen error:', err);
    const message = err instanceof Error ? err.message : 'Image generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
