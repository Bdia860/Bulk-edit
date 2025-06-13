"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface ImageReplacerProps {
  content: string
  onContentChange: (newContent: string) => void
}

type ImageInfo = {
  id: string
  src: string
  tag: string
}

export function ImageReplacer({ content, onContentChange }: ImageReplacerProps) {
  const [images, setImages] = useState<ImageInfo[]>([])
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  const extractImages = useCallback((htmlContent: string): ImageInfo[] => {
    const imgRegex = /<img[^>]+src="data:image\/[^;]+;base64,[^"]+"[^>]*>/gi
    const matches = [...htmlContent.matchAll(imgRegex)]
    const srcRegex = /src="([^"]+)"/i

    return matches.map((match) => {
      const imgTag = match[0]
      const srcMatch = imgTag.match(srcRegex)
      const src = srcMatch ? srcMatch[1] : ""
      return {
        id: Math.random().toString(36).substring(2, 15),
        tag: imgTag,
        src,
      }
    })
  }, [])

  useEffect(() => {
    const extracted = extractImages(content)
    setImages(extracted)
  }, [content, extractImages])

  const handleReplaceClick = (imageId: string) => {
    setSelectedImageId(imageId)
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedImageId) return

    const imageToReplace = images.find(img => img.id === selectedImageId)
    if (!imageToReplace) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const newSrc = e.target?.result as string
      if (!newSrc) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de lire le fichier image." })
        return
      }

      const updatedTag = imageToReplace.tag.replace(/src="[^"]+"/, `src="${newSrc}"`)
      const updatedContent = content.replace(imageToReplace.tag, updatedTag)

      onContentChange(updatedContent)
      toast({ title: "Succès", description: "L'image a été remplacée." })
    }
    reader.onerror = () => {
        toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue lors de la lecture du fichier." })
    }
    reader.readAsDataURL(file)

    // Reset file input value to allow selecting the same file again
    if(event.target) {
        event.target.value = ''
    }
    setSelectedImageId(null)
  }

  return (
    <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Remplacer une image</h3>
        {images.length === 0 ? (
            <p className="text-muted-foreground">Aucune image (en format base64) trouvée dans le contenu.</p>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                    <div key={image.id} className="relative group border rounded-md p-2">
                        <img src={image.src} alt="Image from content" className="w-full h-auto rounded-md object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button onClick={() => handleReplaceClick(image.id)}>Remplacer</Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml"
            className="hidden"
        />
    </div>
  )
}
