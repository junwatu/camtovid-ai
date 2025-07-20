"use client"

import { useEffect } from "react"
import { Camera, RotateCcw, Download, Wand2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

// Custom hooks
import { useCamera } from "@/hooks/use-camera"
import { useVideoGeneration } from "@/hooks/use-video-generation"
import { useDataPersistence } from "@/hooks/use-data-persistence"
import { useAppState } from "@/hooks/use-app-state"

// Utilities
import { downloadVideo } from "@/lib/download-utils"

export default function AIVideoGeneratorRefactored() {
  const { toast } = useToast()

  // App state management
  const {
    state,
    activeTab,
    capturedImage,
    prompt,
    isPlaying,
    setState,
    setActiveTab,
    setCapturedImage,
    setPrompt,
    setIsPlaying,
    resetToCamera,
  } = useAppState()

  // Camera management
  const {
    facingMode,
    videoDevices,
    videoRef,
    canvasRef,
    startCamera,
    switchCamera,
    capturePhoto,
  } = useCamera({
    onError: (error) => toast({
      title: "Camera Error",
      description: error,
      variant: "destructive",
    }),
    onSuccess: (message) => {
      if (message === "Photo captured successfully") {
        toast({
          title: "Photo Captured!",
          description: "Your photo has been captured successfully.",
        })
      }
    },
  })

  // Video generation management
  const {
    isLoading,
    generationStatus,
    generatedVideo,
    uploadedImageUrl,
    generateVideo: performGeneration,
  } = useVideoGeneration({
    onSuccess: async (videoUrl, imageUrl, promptText) => {
      setState('completed')
      setActiveTab('video')
      
      toast({
        title: "Video Generated!",
        description: "Your AI video has been generated successfully.",
      })

      // Auto-save data
      const saved = await saveData({
        imageURL: imageUrl,
        prompt: promptText,
        generatedVideoURL: videoUrl,
      })

      if (saved) {
        toast({
          title: "Data Saved!",
          description: "Video data saved to GridDB successfully.",
        })
      }
    },
    onError: (error) => {
      setState('captured')
      toast({
        title: "Generation Failed",
        description: error,
        variant: "destructive",
      })
    },
  })

  // Data persistence
  const { saveData } = useDataPersistence({
    onSuccess: (id) => {
      toast({
        title: "Data Saved!",
        description: `Video data saved to GridDB successfully. ID: ${id}`,
      })
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Video generated successfully, but failed to save metadata to database.",
        variant: "destructive",
      })
    },
  })

  // Handle photo capture
  const handleCapturePhoto = () => {
    const imageData = capturePhoto()
    if (imageData) {
      setCapturedImage(imageData)
      setState('captured')
    }
  }

  // Handle retake photo
  const handleRetakePhoto = () => {
    resetToCamera()
  }

  // Handle video generation
  const handleGenerateVideo = () => {
    if (!capturedImage || !prompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please capture a photo and enter a prompt.",
        variant: "destructive",
      })
      return
    }

    setState('generating')
    performGeneration(capturedImage, prompt)
  }

  // Handle video download
  const handleDownloadVideo = () => {
    if (generatedVideo) {
      downloadVideo(
        generatedVideo,
        undefined,
        () => {
          toast({
            title: "Download Started",
            description: "Your video download has started.",
          })
        },
        (error) => {
          toast({
            title: "Download Failed",
            description: error,
            variant: "destructive",
          })
        }
      )
    }
  }

  // Start camera when component mounts and state is camera
  useEffect(() => {
    if (state === "camera") {
      startCamera(facingMode)
    }
  }, [state, facingMode, startCamera])

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // This will be called when component unmounts
      // The stopCamera function will be called automatically by the hook
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4">
      <div className="max-w-md mx-auto px-2">
        {/* Header */}
        <div className="text-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI Video Generator</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">
              Capture a photo and generate AI-powered videos
            </p>
          </div>
        </div>

        {/* Main Tabbed Interface */}
        <Card>
          <CardContent className="p-0">
            <Tabs 
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="capture" 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="capture">Capture</TabsTrigger>
                <TabsTrigger value="video" disabled={!generatedVideo}>
                  Generated Video
                </TabsTrigger>
              </TabsList>

              {/* Capture Tab */}
              <TabsContent value="capture" className="p-6 space-y-6">
                {/* Camera/Photo Section */}
                <div>
                  <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    {state === "camera" && (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                          <Button
                            onClick={handleCapturePhoto}
                            size="lg"
                            className="rounded-full w-16 h-16 bg-white hover:bg-gray-100 text-gray-900"
                          >
                            <Camera className="w-6 h-6" />
                          </Button>
                          {videoDevices.length > 1 && (
                             <Button
                               onClick={switchCamera}
                               size="lg"
                               className="rounded-full w-16 h-16 bg-white hover:bg-gray-100 text-gray-900"
                             >
                               <RefreshCw className="w-6 h-6" />
                             </Button>
                          )}
                        </div>
                      </>
                    )}

                    {(state === "captured" || state === "generating" || state === "completed") && capturedImage && (
                      <>
                        <Image
                          src={capturedImage}
                          alt="Captured"
                          width={1080}
                          height={1440}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4">
                          <Button
                            onClick={handleRetakePhoto}
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-gray-900"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retake
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Prompt Input Section - Only show after photo is captured */}
                {(state === "captured" || state === "generating" || state === "completed") && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Wand2 className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Generate Video</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Video Description
                        </label>
                        <Input
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe what you'd like the AI to generate from this photo..."
                          disabled={state === "generating"}
                          className="w-full"
                        />
                      </div>

                      <Button
                        onClick={handleGenerateVideo}
                        disabled={!capturedImage || !prompt.trim() || state === "generating"}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            {`Generating Video... ${generationStatus ? `(${generationStatus.toLowerCase()})` : ''}`}
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate Video
                          </>
                        )}
                      </Button>

                      {state === "generating" && (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                          <div className="animate-pulse">AI is processing your request...</div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full animate-pulse"
                              style={{ width: "60%" }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Generated Video Tab */}
              <TabsContent value="video" className="p-6">
                {generatedVideo && (
                  <div className="space-y-6">
                    <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      <video
                        src={generatedVideo}
                        className="w-full h-full object-cover"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        controls
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button onClick={handleDownloadVideo} variant="outline" className="w-full bg-transparent text-gray-900" size="lg">
                        <Download className="w-4 h-4 mr-2" />
                        Download Video
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Toaster />
      </div>
    </div>
  )
}
