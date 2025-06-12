import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  console.log('🔍 Proxy GET request received:', req.url)
  const token = req.headers.get('authorization') || req.nextUrl.searchParams.get('token')
  if (!token) {
    console.error('❌ Token manquant dans la requête')
    return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
  }

  const page = req.nextUrl.searchParams.get('page') || '1'
  const per_page = req.nextUrl.searchParams.get('per_page') || '1000'
  const search = req.nextUrl.searchParams.get('search') || ''
  const apiUrl = `https://api.kpulse.fr/k3-geosquare/offer_templates?per_page=${per_page}&page=${page}&sort=type_id%20DESC%20NULLS%20LAST&with_inactivated=0&only_deleted=0&search=${encodeURIComponent(search)}`
  
  console.log('📡 Appel API vers:', apiUrl)

  try {
    console.log('🔑 En-têtes de requête:', {
      'Authorization': token ? `${token.substring(0, 10)}...` : 'Non défini',
      'Content-Type': 'application/json'
    })
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('📥 Réponse reçue:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    // Check if response is OK before trying to parse as JSON
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API:', response.status, errorText.substring(0, 500))
      return NextResponse.json({ 
        error: `Erreur API: ${response.status} ${response.statusText}`, 
        details: errorText.substring(0, 500) // Include more of the error for debugging
      }, { status: response.status })
    }
    
    // Check content type to ensure we're getting JSON
    const contentType = response.headers.get('content-type')
    console.log('🔍 Content-Type reçu:', contentType)
    
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text()
      console.error('❌ Format de réponse invalide:', contentType)
      console.error('❌ Aperçu de la réponse:', responseText.substring(0, 500))
      return NextResponse.json({ 
        error: 'Format de réponse invalide', 
        contentType,
        preview: responseText.substring(0, 500)
      }, { status: 500 })
    }
    
    // Clone the response to read it twice
    const clonedResponse = response.clone()
    
    try {
      const data = await response.json()
      console.log('✅ Données JSON reçues avec succès')
      return NextResponse.json(data, { status: response.status })
    } catch (jsonError: unknown) {
      // If JSON parsing fails, get the text to see what's wrong
      const responseText = await clonedResponse.text()
      console.error('❌ Erreur de parsing JSON:', jsonError)
      console.error('❌ Contenu de la réponse:', responseText.substring(0, 500))
      return NextResponse.json({ 
        error: 'Erreur de parsing JSON', 
        message: jsonError instanceof Error ? jsonError.message : String(jsonError),
        preview: responseText.substring(0, 500)
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Erreur proxy:', error)
    return NextResponse.json({ error: 'Erreur proxy: ' + error.message }, { status: 500 })
  }
}
