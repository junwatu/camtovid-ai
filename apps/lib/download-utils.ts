/**
 * Downloads a file from a URL
 * @param url - The URL of the file to download
 * @param filename - The desired filename for the download
 * @param onSuccess - Optional callback for successful download
 * @param onError - Optional callback for download error
 */
export function downloadFile(
  url: string,
  filename: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
): void {
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    onSuccess?.()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Download failed'
    onError?.(errorMessage)
  }
}

/**
 * Downloads a video file with a standard naming convention
 * @param videoUrl - The URL of the video to download
 * @param customName - Optional custom name (defaults to "ai-generated-video")
 * @param onSuccess - Optional callback for successful download
 * @param onError - Optional callback for download error
 */
export function downloadVideo(
  videoUrl: string,
  customName?: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
): void {
  const filename = `${customName || 'ai-generated-video'}.mp4`
  downloadFile(videoUrl, filename, onSuccess, onError)
}

/**
 * Downloads an image file
 * @param imageUrl - The URL of the image to download
 * @param customName - Optional custom name (defaults to "captured-image")
 * @param format - Image format (defaults to "jpg")
 * @param onSuccess - Optional callback for successful download
 * @param onError - Optional callback for download error
 */
export function downloadImage(
  imageUrl: string,
  customName?: string,
  format: 'jpg' | 'png' | 'webp' = 'jpg',
  onSuccess?: () => void,
  onError?: (error: string) => void
): void {
  const filename = `${customName || 'captured-image'}.${format}`
  downloadFile(imageUrl, filename, onSuccess, onError)
}

/**
 * Creates a data URL from a canvas element and downloads it
 * @param canvas - The canvas element to download
 * @param filename - The desired filename
 * @param format - Image format (defaults to "jpeg")
 * @param quality - Image quality (0-1, defaults to 0.92)
 * @param onSuccess - Optional callback for successful download
 * @param onError - Optional callback for download error
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg',
  quality: number = 0.92,
  onSuccess?: () => void,
  onError?: (error: string) => void
): void {
  try {
    const mimeType = `image/${format}`
    const dataUrl = canvas.toDataURL(mimeType, quality)
    downloadFile(dataUrl, filename, onSuccess, onError)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Canvas download failed'
    onError?.(errorMessage)
  }
}
