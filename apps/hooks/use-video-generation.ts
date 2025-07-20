'use client'

import { useState, useCallback } from 'react'
import { VideoService } from '@/lib/video-service'

export type GenerationState = 'idle' | 'uploading' | 'generating' | 'completed' | 'failed'

export interface VideoGenerationOptions {
  onSuccess?: (videoUrl: string, imageUrl: string, prompt: string) => void
  onError?: (error: string) => void
  onStatusChange?: (status: string) => void
  pollInterval?: number
}

export interface VideoGenerationHookReturn {
  // State
  state: GenerationState
  isLoading: boolean
  generationStatus: string | null
  generatedVideo: string | null
  uploadedImageUrl: string | null
  
  // Methods
  generateVideo: (imageData: string, prompt: string) => Promise<void>
  resetState: () => void
}

export function useVideoGeneration(options: VideoGenerationOptions = {}): VideoGenerationHookReturn {
  const [state, setState] = useState<GenerationState>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  const { pollInterval = 2000 } = options

  const resetState = useCallback(() => {
    setState('idle')
    setIsLoading(false)
    setGenerationStatus(null)
    setGeneratedVideo(null)
    setUploadedImageUrl(null)
  }, [])

  const generateVideo = useCallback(async (imageData: string, prompt: string) => {
    if (!imageData || !prompt.trim()) {
      options.onError?.('Please provide both an image and a prompt.')
      return
    }

    setState('uploading')
    setIsLoading(true)
    setGenerationStatus('uploading')

    try {
      // Upload image
      const uploadResult = await VideoService.uploadImage(imageData)
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Image upload failed')
      }
      setUploadedImageUrl(uploadResult.url)

      // Start video generation
      setState('generating')
      setGenerationStatus('initializing')
      
      const result = await VideoService.generateVideo({
        image_url: uploadResult.url,
        prompt: prompt,
      })

      if (result.success && result.request_id) {
        const imageUrl = uploadResult.url
        
        // Polling function
        const poll = async () => {
          try {
            const videoResult = await VideoService.getVideoResult(result.request_id!)
            const status = (videoResult as any).status
            
            setGenerationStatus(status)
            options.onStatusChange?.(status)

            if (status === 'COMPLETED') {
              const generatedVideoUrl = (videoResult as any).data.data.video.url
              setGeneratedVideo(generatedVideoUrl)
              setState('completed')
              setIsLoading(false)
              setGenerationStatus(null)
              
              options.onSuccess?.(generatedVideoUrl, imageUrl, prompt)
              
            } else if (status === 'FAILED' || status === 'CANCELLED') {
              throw new Error((videoResult as any).error || 'Video generation failed')
              
            } else {
              // Continue polling
              setTimeout(poll, pollInterval)
            }
          } catch (error) {
            setState('failed')
            setIsLoading(false)
            setGenerationStatus(null)
            const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating video'
            options.onError?.(errorMessage)
          }
        }
        
        poll()
      } else {
        throw new Error(result.error || 'Failed to start video generation')
      }
    } catch (error) {
      setState('failed')
      setIsLoading(false)
      setGenerationStatus(null)
      const errorMessage = error instanceof Error ? error.message : 'Video generation failed'
      options.onError?.(errorMessage)
    }
  }, [options, pollInterval])

  return {
    state,
    isLoading,
    generationStatus,
    generatedVideo,
    uploadedImageUrl,
    generateVideo,
    resetState,
  }
}
