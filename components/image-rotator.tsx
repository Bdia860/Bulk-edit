"use client"

import { useState, useEffect, useCallback } from "react"
import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import cn from "classnames"

interface ImageRotatorProps {
  content: string
  onContentChange: (newContent: string) => void
}

type ImageInfo = {
  id: string
  src: string
  tag: string
  rotation: number
}

// Fonction pour faire pivoter une image base64 via Canvas
function rotateImage(srcBase64: string, degrees: number, callback: (rotatedBase64: string) => void): void {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const image = new Image()

  image.onload = function() {
    // Dimensions du canvas selon rotation
    if (degrees % 180 === 0) {
      canvas.width = image.width
      canvas.height = image.height
    } else {
      canvas.width = image.height
      canvas.height = image.width
    }

    if (ctx) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((degrees * Math.PI) / 180)
      ctx.drawImage(image, -image.width / 2, -image.height / 2)

      const rotatedBase64 = canvas.toDataURL()
      callback(rotatedBase64)
    }
  }

  image.src = srcBase64
}

export function ImageRotator({ content, onContentChange }: ImageRotatorProps) {
  const [images, setImages] = useState<ImageInfo[]>([])
  const [hoveredImage, setHoveredImage] = useState<number | null>(null)
  const [processingImages, setProcessingImages] = useState<string[]>([])
  const { toast } = useToast()

  // Extraction des images base64 dans le contenu
  const extractImages = useCallback((htmlContent: string): ImageInfo[] => {
    const imgRegex = /<img[^>]+src="data:image\/(jpeg|png|gif|svg\+xml|webp);base64,[^"]+?"[^>]*>/gi
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
        rotation: 0
      }
    })
  }, [])

  // Mise à jour des images quand le contenu change
  useEffect(() => {
    const extracted = extractImages(content)
    setImages(extracted)
  }, [content, extractImages])

  // Faire pivoter une image (90° à chaque clic)
  const handleRotateImage = useCallback((imageId: string) => {
    if (processingImages.includes(imageId)) return
    const imageToRotate = images.find(img => img.id === imageId)
    if (!imageToRotate) return

    setProcessingImages(prev => [...prev, imageId])

    const newRotation = (imageToRotate.rotation + 90) % 360

    rotateImage(imageToRotate.src, 90, (rotatedBase64) => {
      // Mise à jour du contenu en remplaçant l'image d'origine par la version pivotée
      const updatedTag = imageToRotate.tag.replace(/src="[^"]+"/, `src="${rotatedBase64}"`)
      const updatedContent = content.replace(imageToRotate.tag, updatedTag)

      // Mise à jour des images en local
      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, src: rotatedBase64, tag: updatedTag, rotation: newRotation }
          : img
      ))

      onContentChange(updatedContent)

      setProcessingImages(prev => prev.filter(id => id !== imageId))

      toast({
        title: "Image pivotée",
        description: `L'image a été pivotée de 90° (${newRotation}° au total)`,
        duration: 2000
      })
    })
  }, [images, content, onContentChange, processingImages, toast])

  // Réinitialiser toutes les rotations en rechargeant le contenu initial (sans rotation)
  const resetAllRotations = useCallback(() => {
    // Extraire les images du contenu initial sans rotation (base64 originaux)
    const extracted = extractImages(content)
    const hasRotations = images.some(img => img.rotation !== 0)
    if (!hasRotations) {
      toast({
        title: "Aucun changement nécessaire",
        description: "Les images sont déjà dans leur orientation d'origine",
        duration: 3000
      })
      return
    }

    // Construire un contenu où toutes les images sont remises à leur src originaux (sans rotation)
    let newContent = content
    images.forEach(img => {
      if (img.rotation !== 0) {
        // Remplacer la balise avec rotation par celle d'origine
        const originalImg = extracted.find(e => e.src === img.src) || img
        newContent = newContent.replace(img.tag, originalImg.tag)
      }
    })

    setImages(extracted)
    onContentChange(newContent)

    toast({
      title: "Réinitialisation des rotations",
      description: "Toutes les images ont été remises à leur orientation d'origine",
      duration: 3000
    })
  }, [content, images, onContentChange, extractImages, toast])

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-muted-foreground mb-4">Aucune image trouvée dans le contenu</p>
        <p className="text-sm text-muted-foreground">
          Les images doivent être au format base64 pour être détectées et manipulées par cet outil.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Images du template ({images.length})</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAllRotations}
            disabled={!images.some(img => img.rotation !== 0)}
          >
            Réinitialiser toutes les rotations
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Cliquez sur une image pour la faire pivoter de 90° dans le sens horaire.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, idx) => (
            <div
              key={image.id}
              className="relative border rounded-md overflow-hidden flex items-center justify-center p-2 bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer"
              style={{ height: 200 }}
              onClick={() => handleRotateImage(image.id)}
              onMouseEnter={() => setHoveredImage(idx)}
              onMouseLeave={() => setHoveredImage(null)}
            >
              <img
                src={image.src}
                alt={`Image ${idx + 1}`}
                className="max-h-full max-w-full object-contain transition-transform"
                draggable={false}
              />
              {hoveredImage === idx && (
                <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Pivoter (rotation actuelle : {image.rotation}°)
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              <div className="absolute bottom-1 left-1 right-1 bg-background/70 px-2 py-0.5 text-xs rounded">
                <Label className="truncate block">Rotation : {image.rotation}°</Label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
