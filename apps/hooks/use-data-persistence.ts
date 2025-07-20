'use client'

import { useState, useCallback } from 'react'
import { VideoService, SaveDataRequest } from '@/lib/video-service'

export interface DataPersistenceOptions {
  onSuccess?: (id: number) => void
  onError?: (error: string) => void
}

export interface DataPersistenceHookReturn {
  isLoading: boolean
  saveData: (data: SaveDataRequest) => Promise<boolean>
  lastSavedId: number | null
}

export function useDataPersistence(options: DataPersistenceOptions = {}): DataPersistenceHookReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSavedId, setLastSavedId] = useState<number | null>(null)

  const saveData = useCallback(async (data: SaveDataRequest): Promise<boolean> => {
    if (!data.imageURL || !data.prompt || !data.generatedVideoURL) {
      options.onError?.('Missing required data for saving')
      return false
    }

    setIsLoading(true)
    
    try {
      const saveResult = await VideoService.saveData({
        imageURL: data.imageURL,
        prompt: data.prompt,
        generatedVideoURL: data.generatedVideoURL
      })
      
      if (saveResult.success && saveResult.id) {
        setLastSavedId(saveResult.id)
        options.onSuccess?.(saveResult.id)
        return true
      } else {
        throw new Error(saveResult.error || 'Failed to save data')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save data'
      options.onError?.(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [options])

  return {
    isLoading,
    saveData,
    lastSavedId,
  }
}
