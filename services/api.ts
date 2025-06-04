export interface Config {
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  style: string
}

// Ajouter une fonction pour tester la connectivité de l'API
export async function testApiConnection(token: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Test de connexion à l'API...")

    // Utiliser la même URL et méthode que le script PowerShell qui fonctionne
    const response = await fetch(
      "https://api.kpulse.fr/k3-geosquare/offer_templates?per_page=1&page=1&sort=type_id%20DESC%20NULLS%20LAST&with_inactivated=0&only_deleted=0",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (response.ok) {
      return { success: true, message: "Connexion à l'API réussie" }
    } else {
      return {
        success: false,
        message: `Erreur de connexion: ${response.status} ${response.statusText}`,
      }
    }
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error)

    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        success: false,
        message: "Impossible de se connecter à l'API. Vérifiez votre connexion internet ou si l'API est accessible.",
      }
    }

    return {
      success: false,
      message: `Erreur de connexion: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function fetchOfferTemplates(page = 1, perPage = 10, search = "", token: string) {
  if (!token || typeof token !== "string" || !token.trim()) {
    throw new Error("API token is not configured. Please check your environment variables.")
  }

  try {
    // Utiliser la même URL que le script PowerShell qui fonctionne
    const apiUrl = `/api/proxy-offer-templates?per_page=${perPage}&page=${page}&search=${encodeURIComponent(search)}`

    console.log("Fetching templates from local proxy...", {
      url: apiUrl,
      hasToken: !!token,
      tokenLength: token.length,
      tokenStart: token.substring(0, 5) + "...",
    })

    // Simplifier les headers pour correspondre au script PowerShell
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      })
      throw new Error(`API error: ${response.status} ${response.statusText}. ${errorBody}`)
    }

    const data = await response.json()
    console.log("API Response received successfully")

    // Le reste du code reste identique...
    console.log("API Raw Response Structure:", Object.keys(data))
    console.log(
      "Sample model structure:",
      data.models && data.models.length > 0 ? Object.keys(data.models[0]) : "No models",
    )

    if (!data || !data.models || !Array.isArray(data.models)) {
      console.error("Unexpected response format:", data)
      throw new Error("Invalid response format")
    }

    // Log a sample template with its config and style
    if (data.models.length > 0) {
      const sampleModel = data.models[0]
      console.log("Sample template from API - ID:", sampleModel.id)
      console.log("Sample template config:", sampleModel.config)
      console.log("Sample template style (direct property):", sampleModel.style)
      console.log("Sample template header:", sampleModel.header)
      console.log("Sample template footer:", sampleModel.footer)
    }

    return {
      data: data.models
        .map((model: any) => {
          // Récupérer le style depuis la propriété de premier niveau
          const styleFromRoot = model.style || ""
          console.log(`Template ${model.id} style:`, styleFromRoot)

          // Récupérer le header et le footer
          const header = model.header || ""
          const footer = model.footer || ""
          console.log(`Template ${model.id} header:`, header)
          console.log(`Template ${model.id} footer:`, footer)

          // Créer la configuration avec le style
          const config = {
            ...(model.config || {
              marginTop: "25mm",
              marginRight: "10mm",
              marginBottom: "25mm",
              marginLeft: "10mm",
            }),
            // Ajouter le style à la config
            style: styleFromRoot,
          }

          const template = {
            id: model.id || "unknown",
            name: model.name || "Unnamed Template",
            content: model.content || "Content not available",
            type: model.type || "unknown",
            type_code: model.type_code || "unknown",
            deleted_at: model.deleted_at || null,
            inactivated_at: model.inactivated_at || null,
            config: config,
            header: header,
            footer: footer,
          }

          console.log(`Template ${model.id} processed config:`, template.config)
          return template
        })
        .filter((template: any) => template !== null),
      total: data.total || 0,
      per_page: data.per_page || perPage,
      current_page: data.current_page || page,
    }
  } catch (error) {
    console.error("Fetch error:", error)

    // Améliorer le diagnostic d'erreur
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.error(
        "Erreur réseau: Impossible de se connecter à l'API. Vérifiez votre connexion internet ou si l'API est accessible.",
      )
    } else if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Timeout: La requête a été abandonnée car elle a pris trop de temps.")
    }

    throw error
  }
}

// Le reste du fichier reste inchangé...
export async function updateOfferTemplate(
  id: string,
  content: string,
  config: Config,
  token: string,
  header?: string,
  footer?: string,
) {
  if (!token || typeof token !== "string" || !token.trim()) {
    throw new Error("API token is not configured. Please check your environment variables.")
  }

  // Extraire le style de la config pour l'envoyer comme propriété de premier niveau
  const { style, ...configWithoutStyle } = config

  console.log("Updating template with ID:", id)
  console.log("Updating template with config:", configWithoutStyle)
  console.log("Updating template with style:", style)
  console.log("Updating template with header:", header)
  console.log("Updating template with footer:", footer)

  try {
    const requestBody: any = {
      content,
      config: configWithoutStyle,
      style: style || "", // Toujours envoyer une string, même vide
    }

    // Gestion plus robuste des champs optionnels
    // Test 1: Envoyer des strings vides plutôt que undefined/null
    requestBody.header = header !== undefined ? header : ""
    requestBody.footer = footer !== undefined ? footer : ""

    // Alternative pour tester si l'API préfère null ou omission complète :
    // if (header !== undefined) {
    //   requestBody.header = header
    // }
    // if (footer !== undefined) {
    //   requestBody.footer = footer
    // }

    console.log("Request body:", JSON.stringify(requestBody, null, 2))
    console.log("Request body keys:", Object.keys(requestBody))
    console.log("Header value type:", typeof requestBody.header, "Value:", requestBody.header)
    console.log("Footer value type:", typeof requestBody.footer, "Value:", requestBody.footer)

    const response = await fetch(`/api/proxy-offer-templates/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("API Error Response:", errorBody)
      console.error("Request that failed:", {
        url: `/api/proxy-offer-templates/${id}`,
        method: "PUT",
        body: requestBody,
      })
      throw new Error(`API error: ${response.status} ${response.statusText}. ${errorBody}`)
    }

    const data = await response.json()
    console.log("Update response:", data)
    return data
  } catch (error) {
    console.error("Update error:", error)
    throw error
  }
}

// Ajouter une fonction pour créer un nouveau template (POST)
export async function createOfferTemplate(
  content: string,
  name: string,
  type: string,
  config: Config,
  token: string,
  header?: string,
  footer?: string,
) {
  if (!token || typeof token !== "string" || !token.trim()) {
    throw new Error("API token is not configured. Please check your environment variables.")
  }

  const { style, ...configWithoutStyle } = config

  try {
    const requestBody: any = {
      name,
      content,
      type,
      config: configWithoutStyle,
      style: style || "",
      header: header !== undefined ? header : "",
      footer: footer !== undefined ? footer : "",
    }

    console.log("Creating new template:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`https://api.kpulse.fr/k3-geosquare/offer_templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("API Error Response:", errorBody)
      throw new Error(`API error: ${response.status} ${response.statusText}. ${errorBody}`)
    }

    const data = await response.json()
    console.log("Create response:", data)
    return data
  } catch (error) {
    console.error("Create error:", error)
    throw error
  }
}

// Ajouter une fonction pour vérifier si un template existe
export async function checkTemplateExists(id: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.kpulse.fr/k3-geosquare/offer_templates/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Error checking template existence:", error)
    return false
  }
}
