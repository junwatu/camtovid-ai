'use client'

import { useState, useCallback } from 'react'

export type AppState = 'camera' | 'captured' | 'generating' | 'completed'

export interface AppStateHookReturn {
  // State
  state: AppState
  activeTab: string
  capturedImage: string | null
  prompt: string
  isPlaying: boolean
  
  // Actions
  setState: (state: AppState) => void
  setActiveTab: (tab: string) => void
  setCapturedImage: (image: string | null) => void
  setPrompt: (prompt: string) => void
  setIsPlaying: (playing: boolean) => void
  resetToCamera: () => void
  resetAll: () => void
}

export function useAppState(): AppStateHookReturn {
  const [state, setState] = useState<AppState>('camera')
  const [activeTab, setActiveTab] = useState('capture')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  const resetToCamera = useCallback(() => {
    setState('camera')
    setActiveTab('capture')
    setCapturedImage(null)
    setPrompt('')
    setIsPlaying(false)
  }, [])

  const resetAll = useCallback(() => {
    setState('camera')
    setActiveTab('capture')
    setCapturedImage(null)
    setPrompt('')
    setIsPlaying(false)
  }, [])

  return {
    // State
    state,
    activeTab,
    capturedImage,
    prompt,
    isPlaying,
    
    // Actions
    setState,
    setActiveTab,
    setCapturedImage,
    setPrompt,
    setIsPlaying,
    resetToCamera,
    resetAll,
  }
}
