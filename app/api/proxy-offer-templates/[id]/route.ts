import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization') || req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
  }

  const { id } = params
  const apiUrl = `https://api.kpulse.fr/k3-geosquare/offer_templates/${id}`
  const body = await req.text()

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body,
    })
    const text = await response.text()
    return new NextResponse(text, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur proxy: ' + error.message }, { status: 500 })
  }
}