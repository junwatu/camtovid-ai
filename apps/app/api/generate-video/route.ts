import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure the Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY || process.env.FAL_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, image_url, duration = "5", aspect_ratio = "16:9", cfg_scale = 0.5 } = await request.json();

    // Validate required fields
    if (!prompt || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and image_url' },
        { status: 400 }
      );
    }

    const host = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const webhookUrl = `${protocol}://${host}/api/fal-webhook`;

    // Generate video using Fal.ai Kling model
    const result = await fal.queue.submit("fal-ai/kling-video/v2.1/pro/image-to-video", {
      input: {
        prompt,
        image_url,
        duration,
        aspect_ratio,
        cfg_scale,
        negative_prompt: "blur, distort, and low quality"
      },
      webhookUrl: webhookUrl,
    });

    return NextResponse.json({
      success: true,
      request_id: result.request_id,
    });

  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
