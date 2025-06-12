import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  console.log(' Proxy PUT request received:', req.url)
  const token = req.headers.get('authorization') || req.nextUrl.searchParams.get('token')
  if (!token) {
    console.error(' Token manquant dans la requête')
    return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
  }

  const { id } = params
  const apiUrl = `https://api.kpulse.fr/k3-geosquare/offer_templates/${id}`
  console.log(' Appel API vers:', apiUrl)
  
  try {
    const body = await req.text()
    console.log(' Corps de la requête:', body.substring(0, 200) + '...')
    
    console.log(' En-têtes de requête:', {
      'Authorization': token ? `${token.substring(0, 10)}...` : 'Non défini',
      'Content-Type': 'application/json'
    })
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body,
    })
    
    console.log(' Réponse reçue:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text()
      console.error(' Erreur API:', response.status, errorText.substring(0, 500))
      return NextResponse.json({ 
        error: `Erreur API: ${response.status} ${response.statusText}`, 
        details: errorText.substring(0, 500)
      }, { status: response.status })
    }
    
    // Clone the response to read it twice if needed
    const clonedResponse = response.clone()
    
    try {
      // Try to parse as JSON first
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json()
        console.log(' Données JSON reçues avec succès')
        return NextResponse.json(jsonData, { status: response.status })
      } else {
        // If not JSON, return as text
        const text = await clonedResponse.text()
        console.log(' Données texte reçues avec succès')
        return new NextResponse(text, { status: response.status })
      }
    } catch (parseError: unknown) {
      // If parsing fails, return the raw text
      const text = await clonedResponse.text()
      console.error(' Erreur de parsing:', parseError)
      return new NextResponse(text, { status: response.status })
    }
  } catch (error: any) {
    console.error(' Erreur proxy:', error)
    return NextResponse.json({ error: 'Erreur proxy: ' + error.message }, { status: 500 })
  }
}