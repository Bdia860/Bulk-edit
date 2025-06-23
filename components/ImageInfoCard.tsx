"use client"

import { useState, useEffect } from "react"

interface ImageInfoCardProps {
  base64: string
  imgTag: string
  onUpdateTag: (newTag: string) => void
  /**
   * Callback pour remplacer le tag <img ...> dans le content global (HTML principal)
   * oldTag = imgTag d'origine, newTag = tag modifié
   */
  onReplaceInContent?: (oldTag: string, newTag: string) => void
}

export function ImageInfoCard({ base64, imgTag, onUpdateTag, onReplaceInContent }: ImageInfoCardProps) {
  const [info, setInfo] = useState<{
    width: number
    height: number
    sizeKb: number
    format: string
    ratio: string
  } | null>(null)

  const [attributes, setAttributes] = useState<Record<string, string>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editableStyle, setEditableStyle] = useState("")

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const sizeKb = Math.round((base64.length * 3) / 4 / 1024)
      const formatMatch = base64.match(/^data:image\/([a-zA-Z]+);base64,/)
      setInfo({
        width: img.width,
        height: img.height,
        sizeKb,
        format: formatMatch?.[1] || "unknown",
        ratio: (img.width / img.height).toFixed(3),
      })
    }
    img.src = base64

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(imgTag, "text/html")
      const imageEl = doc.querySelector("img")
      if (imageEl) {
        const attrs: Record<string, string> = {}
        for (const attr of Array.from(imageEl.attributes)) {
          attrs[attr.name] = attr.value
        }
        setAttributes(attrs)
        setEditableStyle(attrs.style || "")
      }
    } catch {
      setAttributes({})
      setEditableStyle("")
    }
  }, [base64, imgTag])

  const handleSaveStyle = () => {
    console.log('[ImageInfoCard] handleSaveStyle called');
    console.log('imgTag:', imgTag);
    console.log('editableStyle:', editableStyle);
    console.log('onUpdateTag:', typeof onUpdateTag === 'function');
    console.log('onReplaceInContent:', typeof onReplaceInContent === 'function');
    if (!imgTag || (!onUpdateTag && !onReplaceInContent)) {
      console.warn('[ImageInfoCard] Annulé : imgTag manquant ou aucun callback défini');
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(imgTag, "text/html");
      const imageEl = doc.querySelector("img");
      if (!imageEl) {
        console.warn('[ImageInfoCard] Aucun élément <img> trouvé dans imgTag');
        return;
      }

      imageEl.setAttribute("style", editableStyle.trim());

      const newTag = imageEl.outerHTML;
      console.log('[ImageInfoCard] newTag généré:', newTag);

      // Si un callback global est fourni, on l'utilise pour remplacer dans le content principal
      if (onReplaceInContent) {
        console.log('[ImageInfoCard] Appel onReplaceInContent');
        onReplaceInContent(imgTag, newTag);
      } else {
        console.log('[ImageInfoCard] Appel onUpdateTag');
        onUpdateTag(newTag);
      }
      setAttributes((attrs) => ({ ...attrs, style: editableStyle }));
      setIsModalOpen(false);
    } catch (e) {
      console.error("Erreur lors de la mise à jour du style :", e);
    }
  }

  if (!info) return <p className="text-xs text-muted-foreground">Chargement des infos…</p>

  return (
    <div className="mt-2 text-xs text-muted-foreground border p-2 rounded">
      <div>📐 {info.width}×{info.height}px</div>
      <div>📁 {info.sizeKb} Ko</div>
      <div>🖼️ {info.format.toUpperCase()}</div>
      <div>📏 Ratio: {info.ratio}</div>

      {Object.keys(attributes).length > 0 && (
        <>
          <hr className="my-1" />
          <div><strong>Attributs HTML (hors src):</strong></div>
          <ul className="list-disc ml-4 mb-2">
            {Object.entries(attributes)
              .filter(([key]) => key.toLowerCase() !== "src")
              .map(([key, value]) => (
                <li key={key}><code>{key}="{value}"</code></li>
              ))}
          </ul>
          <button
            className="text-blue-600 underline text-sm"
            onClick={() => setIsModalOpen(true)}
            type="button"
          >
            Modifier le style
          </button>
        </>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white p-4 rounded w-80"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-2">Modifier le style inline</h3>
            <textarea
              className="w-full border p-2 text-xs"
              rows={4}
              value={editableStyle}
              onChange={e => setEditableStyle(e.target.value)}
              placeholder="Exemple : width:723.008px; height:auto;"
              aria-label="Modifier le style inline"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                className="px-3 py-1 border rounded text-gray-700"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={handleSaveStyle}
                type="button"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// Exemple parent minimaliste

export function ImageManagerDemo() {
  const [content, setContent] = useState(`
    <p>Voici un test avec image :</p>
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
      style="width:10.10913in;height:7.1496in;"
      alt="Exemple"
    />
  `)

  const imgRegex = /<img[^>]+src="data:image\/[^;]+;base64,[^"]+"[^>]*>/i
  const match = content.match(imgRegex)
  const imgTag = match ? match[0] : ""
  const srcMatch = imgTag.match(/src="([^"]+)"/i)
  const base64 = srcMatch ? srcMatch[1] : ""

  return (
    <div className="p-4">
      <h2 className="mb-4 font-bold text-xl">Démo Image Manager</h2>

      {imgTag ? (
        <ImageInfoCard
          base64={base64}
          imgTag={imgTag}
          onUpdateTag={(newTag) => {
            const newContent = content.replace(imgTag, newTag)
            setContent(newContent)
          }}
        />
      ) : (
        <p>Aucune image trouvée.</p>
      )}

      <hr className="my-6" />
      <div className="border p-2 whitespace-pre-wrap bg-gray-50 text-xs">
        <strong>Contenu HTML actuel :</strong>
        <br />
        {content}
      </div>
    </div>
  )
}
