import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const result = await request.json();
    console.log('Webhook received:', result);
    // In a real-world app, you would use a WebSocket or a service like Pusher
    // to send the result to the client in real-time.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to handle webhook', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
