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

    // Upload file to Fal.ai storage
    const uploadUrl = await fal.storage.upload(file);

    console.log(uploadUrl);

    return NextResponse.json({
      success: true,
      url: uploadUrl,
      file_name: file.name
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
