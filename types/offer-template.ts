export interface Config {
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  style?: string
}

export interface OfferTemplate {
  id: string
  content: string
  name: string
  type: string
  type_code: string
  deleted_at: string | null
  inactivated_at: string | null
  config: Config
  header?: string // Ajout du header
  footer?: string // Ajout du footer
}

export interface OfferTemplatesResponse {
  data: OfferTemplate[]
  total: number
  per_page: number
  current_page: number
}
