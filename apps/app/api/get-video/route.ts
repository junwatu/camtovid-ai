import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure the Fal.ai client
const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
if (!falKey) {
  throw new Error("FAL_KEY or FAL_API_KEY is not set in the environment variables");
}
fal.config({
  credentials: falKey,
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
    // First, check the status of the request
    const status = await fal.queue.status("fal-ai/kling-video/v2.1/pro/image-to-video", {
        requestId: requestId,
        logs: true,
    });

    // If completed, fetch the actual result
    if (status.status === 'COMPLETED') {
        const result = await fal.queue.result("fal-ai/kling-video/v2.1/pro/image-to-video", {
            requestId: requestId,
        });
        return NextResponse.json({ ...status, data: result });
    }

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch result', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
