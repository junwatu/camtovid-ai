
export interface VideoGenerationRequest {
  prompt: string;
  image_url: string;
  duration?: "5" | "10";
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  cfg_scale?: number;
}

export interface VideoGenerationResponse {
  success: boolean;
  video_url?: string;
  request_id?: string;
  data?: Record<string, unknown>;
  error?: string;
  details?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  file_name?: string;
  error?: string;
  details?: string;
}

export interface SaveDataRequest {
  imageURL: string;
  prompt: string;
  generatedVideoURL: string;
}

export interface SaveDataResponse {
  success: boolean;
  message?: string;
  id?: number;
  error?: string;
  details?: string;
}

export class VideoService {
  private static baseUrl = '/api';

  /**
   * Upload an image to Fal.ai storage
   */
  static async uploadImage(imageData: string): Promise<ImageUploadResponse> {
    try {
      // Convert data URL to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'captured-image.jpg');

      const uploadResponse = await fetch(`${this.baseUrl}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await uploadResponse.json();
      
      if (!uploadResponse.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate video using Fal.ai Kling model
   */
  static async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate video');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate video',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload image and generate video in one call
   */
  static async uploadAndGenerateVideo(
    imageData: string, 
    prompt: string, 
    options: Partial<VideoGenerationRequest> = {}
  ): Promise<VideoGenerationResponse> {
    try {
      // First upload the image
      const uploadResult = await this.uploadImage(imageData);
      
      if (!uploadResult.success || !uploadResult.url) {
        return {
          success: false,
          error: 'Failed to upload image',
          details: uploadResult.error || 'Unknown upload error'
        };
      }

      // Then generate the video
      const videoRequest: VideoGenerationRequest = {
        prompt,
        image_url: uploadResult.url,
        duration: options.duration || "5",
        aspect_ratio: options.aspect_ratio || "16:9",
        cfg_scale: options.cfg_scale || 0.5,
      };

      return await this.generateVideo(videoRequest);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get video generation result from Fal.ai
   */
  static async getVideoResult(requestId: string): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/get-video?request_id=${requestId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get video result');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get video result',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save video data to GridDB
   */
  static async saveData(data: SaveDataRequest): Promise<SaveDataResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/save-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save data');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save data',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
