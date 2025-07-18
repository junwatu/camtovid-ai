import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure the Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY || process.env.FAL_API_KEY,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('request_id');

  if (!requestId) {
    return NextResponse.json(
      { error: 'Missing request_id' },
      { status: 400 }
    );
  }

  try {
    const result = await fal.queue.status("fal-ai/kling-video/v2.1/pro/image-to-video", {
        requestId: requestId,
        logs: true,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch result', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
