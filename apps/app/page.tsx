"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, RotateCcw, Download, Wand2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image";
import { VideoService } from "@/lib/video-service";

type AppState = "camera" | "captured" | "generating" | "completed"

export default function AIVideoGenerator() {
  const [state, setState] = useState<AppState>("camera")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState("capture")
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);


  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch (error) {
      console.error("Error enumerating video devices:", error);
    }
  }, []);

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    stopCamera(); // Stop existing stream first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      // Get updated list of devices after permissions are granted
      await getVideoDevices();
    } catch {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }, [toast, stopCamera, getVideoDevices])

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL("image/jpeg")
        setCapturedImage(imageData)
        setState("captured")
        stopCamera()

        toast({
          title: "Photo Captured!",
          description: "Your photo has been captured successfully.",
        })
      }
    }
  }, [stopCamera, toast])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    setPrompt("")
    setState("camera")
    // The useEffect will handle starting the camera with the correct facingMode
  }, [])

  const generateVideo = useCallback(async () => {
    if (!capturedImage || !prompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please capture a photo and enter a prompt.",
        variant: "destructive",
      })
      return
    }

    setState("generating")
    setIsLoading(true)
    setGenerationStatus("initializing");

    try {
      const result = await VideoService.uploadAndGenerateVideo(capturedImage, prompt);

      if (result.success && result.request_id) {
        // In a real-world app, you would use a WebSocket or a service like Pusher
        // to receive the result from the webhook in real-time. For this example,
        // we'll continue to use polling.
        const poll = async () => {
          try {
            const videoResult = await VideoService.getVideoResult(result.request_id!)
            setGenerationStatus((videoResult as any).status);
            console.log("Polling for video status:", videoResult); 

            if ((videoResult as any).status === 'COMPLETED') {
              setGeneratedVideo((videoResult as any).data.data.video.url)
              setState("completed")
              setIsLoading(false)
              setGenerationStatus(null);
              setActiveTab("video") // Switch to the video tab
              toast({
                title: "Video Generated!",
                description: "Your AI video has been generated successfully.",
              })
            } else if ((videoResult as any).status === 'FAILED' || (videoResult as any).status === 'CANCELLED') {
              throw new Error((videoResult as any).error || 'Failed to get video result');
            } else {
              setTimeout(poll, 2000) // Poll every 2 seconds
            }
          } catch (error) {
            toast({
              title: "Video Generation Failed",
              description: error instanceof Error ? error.message : "An error occurred while fetching video status.",
              variant: "destructive",
            })
            setState("captured") // Reset state
            setIsLoading(false)
            setGenerationStatus(null);
          }
        }
        poll()
      } else {
        throw new Error(result.error || 'Failed to generate video');
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
      setState("captured")
      setIsLoading(false)
      setGenerationStatus(null);
    }
  }, [capturedImage, prompt, toast, setActiveTab])


  const downloadVideo = useCallback(() => {
    if (generatedVideo) {
      const link = document.createElement("a")
      link.href = generatedVideo
      link.download = "ai-generated-video.mp4"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download Started",
        description: "Your video download has started.",
      })
    }
  }, [generatedVideo, toast])


  // Start camera when component mounts and state is camera
  useEffect(() => {
    if (state === "camera") {
      startCamera(facingMode);
    }
    return () => stopCamera();
  }, [state, facingMode, startCamera, stopCamera])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
                              onClick={capturePhoto}
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
                            src={capturedImage || "/placeholder.svg"}
                            alt="Captured"
                            width={1080}
                            height={1440}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4">
                            <Button
                              onClick={retakePhoto}
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
                          onClick={generateVideo}
                          disabled={!capturedImage || !prompt.trim() || state === "generating"}
                          className="w-full"
                          size="lg"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              {`Generating Video... ${generationStatus ? `(${(generationStatus as string).toLowerCase()})` : ''}`}
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
                          ref={videoRef}
                          src={generatedVideo}
                          className="w-full h-full object-cover"
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => setIsPlaying(false)}
                          controls
                        />
                      </div>

                      <div className="flex flex-col gap-3">
                

                        <Button onClick={downloadVideo} variant="outline" className="w-full bg-transparent text-gray-900" size="lg">
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
    </ThemeProvider>
  )
}
