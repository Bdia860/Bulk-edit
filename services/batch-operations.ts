import { updateOfferTemplate } from "./api"
import type { Config } from "@/types/offer-template"

export interface BatchOperationResult {
  success: number
  errors: number
  failedIds: string[]
}

export interface BatchProgress {
  current: number
  total: number
  templateId: string
  templateName: string
}

/**
 * Sauvegarde plusieurs templates en une seule opération
 */
export async function batchSaveTemplates(
  templates: { id: string; content: string; config: Config; header?: string; footer?: string }[],
  token: string,
  onProgress?: (progress: BatchProgress) => void,
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    success: 0,
    errors: 0,
    failedIds: [],
  }

  const total = templates.length

  for (let i = 0; i < templates.length; i++) {
    const { id, content, config, header, footer } = templates[i]

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        templateId: id,
        templateName: `Template ${id}`,
      })
    }

    try {
      await updateOfferTemplate(id, content, config, token, header, footer)
      result.success++
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde du template ${id}:`, error)
      result.errors++
      result.failedIds.push(id)
    }
  }

  return result
}
