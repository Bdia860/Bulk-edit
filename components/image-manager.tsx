"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { RotateCw, Replace } from "lucide-react"

interface ImageManagerProps {
  content: string
  onContentChange: (newContent: string) => void
}

type ImageInfo = {
  id: string
  src: string
  tag: string
}

// --- Utility Functions ---
function rotateImage(srcBase64: string, callback: (rotatedBase64: string) => void): void {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const image = new Image()

  image.onload = function() {
    canvas.width = image.height
    canvas.height = image.width
    if (ctx) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((90 * Math.PI) / 180)
      ctx.drawImage(image, -image.height / 2, -image.width / 2) // adjust drawing coords
      callback(canvas.toDataURL())
    }
  }
  image.src = srcBase64
}

// --- Component ---
export function ImageManager({ content, onContentChange }: ImageManagerProps) {
  const [images, setImages] = useState<ImageInfo[]>([])
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageToReplaceId, setImageToReplaceId] = useState<string | null>(null)

  const extractImages = useCallback((htmlContent: string): ImageInfo[] => {
    const imgRegex = /<img[^>]+src="data:image\/[^;]+;base64,[^"]+"[^>]*>/gi
    const matches = [...htmlContent.matchAll(imgRegex)]
    return matches.map((match) => {
      const imgTag = match[0]
      const srcMatch = imgTag.match(/src="([^"]+)"/i)
      return {
        id: Math.random().toString(36).substring(2, 15),
        tag: imgTag,
        src: srcMatch ? srcMatch[1] : "",
      }
    })
  }, [])

  useEffect(() => {
    setImages(extractImages(content))
  }, [content, extractImages])

  // --- Handlers ---
  const handleRotate = (image: ImageInfo) => {
    if (processingIds.includes(image.id)) return
    setProcessingIds(prev => [...prev, image.id])

    rotateImage(image.src, (rotatedBase64) => {
      const updatedTag = image.tag.replace(/src="[^"]+"/, `src="${rotatedBase64}"`)
      const updatedContent = content.replace(image.tag, updatedTag)
      onContentChange(updatedContent)
      toast({ title: "Succès", description: "L'image a pivoté." })
      setProcessingIds(prev => prev.filter(id => id !== image.id))
    })
  }

  const handleTriggerReplace = (imageId: string) => {
    setImageToReplaceId(imageId)
    fileInputRef.current?.click()
  }

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const imageToReplace = images.find(img => img.id === imageToReplaceId)
    if (!file || !imageToReplace) return

    setProcessingIds(prev => [...prev, imageToReplace.id])
    const reader = new FileReader()
    reader.onload = (e) => {
      const newSrc = e.target?.result as string
      const updatedTag = imageToReplace.tag.replace(/src="[^"]+"/, `src="${newSrc}"`)
      const updatedContent = content.replace(imageToReplace.tag, updatedTag)
      onContentChange(updatedContent)
      toast({ title: "Succès", description: "L'image a été remplacée." })
      setProcessingIds(prev => prev.filter(id => id !== imageToReplace.id))
    }
    reader.onerror = () => {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de lire le fichier." })
      setProcessingIds(prev => prev.filter(id => id !== imageToReplace.id))
    }
    reader.readAsDataURL(file)

    if (event.target) event.target.value = ''
    setImageToReplaceId(null)
  }

  // --- Render ---
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Gestion des Images</h3>
      {images.length === 0 ? (
        <p className="text-muted-foreground">Aucune image (en format base64) trouvée.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group border rounded-md p-2">
              <img src={image.src} alt="" className="w-full h-auto rounded-md object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" onClick={() => handleRotate(image)} disabled={processingIds.includes(image.id)}>
                  <RotateCw className={`h-4 w-4 ${processingIds.includes(image.id) ? 'animate-spin' : ''}`} />
                </Button>
                <Button size="icon" onClick={() => handleTriggerReplace(image.id)} disabled={processingIds.includes(image.id)}>
                  <Replace className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected}
        accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml"
        className="hidden"
      />
    </div>
  )
}
