import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import PublicBusinessView from './PublicBusinessView'
import type { Tables } from '@/lib/supabase/database.types'

interface PageProps {
  params: {
    slug: string
  }
}

function normalizeSocialLinks(
  value: unknown
): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record: Record<string, string> = {}

  for (const [key, val] of Object.entries(value)) {
    if (typeof val === 'string') {
      record[key] = val
    }
  }

  return Object.keys(record).length > 0 ? record : null
}

export default async function PublicBusinessPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('public_business_with_products')
    .select('*')
    .eq('public_slug', params.slug)
    .single<Tables<'public_business_with_products'>>()

  if (error || !data) {
    notFound()
  }

  /**
   * Boundary explícito entre backend (VIEW) e UI
   * Nada de passar objeto cru para o componente
   */
  const business = {
    name: data.name,
    description: data.description,
    phone_commercial: data.phone_commercial,
    mobile_commercial: data.mobile_commercial,
    email_commercial: data.email_commercial,

    address_street: data.address_street,
    address_number: data.address_number,
    address_neighborhood: data.address_neighborhood,
    address_city: data.address_city,
    address_state: data.address_state,
    address_zip: data.address_zip,
    address_complement: data.address_complement,

    map_url: data.map_url,
    social_links: normalizeSocialLinks(data.social_links),
  }

  return (
    <PublicBusinessView
      business={business}
      products={data.products}
    />
  )
}
