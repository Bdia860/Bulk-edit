import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization') || req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
  }

  const page = req.nextUrl.searchParams.get('page') || '1'
  const per_page = req.nextUrl.searchParams.get('per_page') || '1000'
  const search = req.nextUrl.searchParams.get('search') || ''
  const apiUrl = `https://api.kpulse.fr/k3-geosquare/offer_templates?per_page=${per_page}&page=${page}&sort=type_id%20DESC%20NULLS%20LAST&with_inactivated=0&only_deleted=0&search=${encodeURIComponent(search)}`

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur proxy: ' + error.message }, { status: 500 })
  }
}
