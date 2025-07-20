'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type FacingMode = 'user' | 'environment'

export interface CameraHookReturn {
  // State
  facingMode: FacingMode
  videoDevices: MediaDeviceInfo[]
  
  // Refs
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  streamRef: React.RefObject<MediaStream | null>
  
  // Methods
  startCamera: (mode: FacingMode) => Promise<void>
  stopCamera: () => void
  switchCamera: () => void
  getVideoDevices: () => Promise<void>
  capturePhoto: () => string | null
}

export interface CameraOptions {
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}

export function useCamera(options: CameraOptions = {}): CameraHookReturn {
  const [facingMode, setFacingMode] = useState<FacingMode>('user')
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const optionsRef = useRef(options)
  
  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(device => device.kind === 'videoinput')
      setVideoDevices(videoInputs)
    } catch (error) {
      console.error('Error enumerating video devices:', error)
      optionsRef.current.onError?.('Failed to get video devices')
    }
  }, [])

  const startCamera = useCallback(async (mode: FacingMode) => {
    console.log(`🎥 Starting camera with mode: ${mode}`)
    stopCamera() // Stop existing stream first
    
    try {
      const constraints = {
        video: { 
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      }
      console.log('📱 Camera constraints:', constraints)
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Wait for video to load metadata
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve
          } else {
            resolve(undefined)
          }
        })
        console.log(`📺 Video dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`)
      }
      
      // Get updated list of devices after permissions are granted
      await getVideoDevices()
      console.log('✅ Camera started successfully')
      optionsRef.current.onSuccess?.('Camera started successfully')
    } catch (error) {
      console.error('❌ Camera error:', error)
      optionsRef.current.onError?.('Unable to access camera. Please check permissions.')
    }
  }, [stopCamera, getVideoDevices])

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        stopCamera()
        optionsRef.current.onSuccess?.('Photo captured successfully')
        return imageData
      }
    }
    optionsRef.current.onError?.('Failed to capture photo')
    return null
  }, [stopCamera])

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    facingMode,
    videoDevices,
    videoRef,
    canvasRef,
    streamRef,
    startCamera,
    stopCamera,
    switchCamera,
    getVideoDevices,
    capturePhoto,
  }
}
