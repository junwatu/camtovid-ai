import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure the Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY || process.env.FAL_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Upload file to Fal.ai storage
    const uploadResult = await fal.storage.upload(uint8Array, {
      content_type: file.type,
      file_name: file.name,
    });


    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      file_name: uploadResult.file_name
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
