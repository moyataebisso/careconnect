export type UserRole = 'user' | 'provider' | 'admin'
export type ListingCategory = 'care_home' | 'assisted_living' | 'foster_care' | 'service' | 'housing'
export type ListingStatus = 'draft' | 'pending' | 'active' | 'inactive'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  company: string | null
  role: UserRole
  verified: boolean
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  title: string
  slug: string
  description: string
  category: ListingCategory
  status: ListingStatus
  address: string
  city: string
  county: string | null
  state: string
  zip_code: string | null
  contact_person: string
  contact_phone: string
  contact_email: string | null
  website: string | null
  capacity: number | null
  current_openings: number
  age_range: string | null
  services: string[]
  languages_spoken: string[]
  funding_accepted: string[]
  disabilities_served: string[]
  license_type: string | null
  license_number: string | null
  business_hours: string | null
  user_id: string
  views: number
  featured: boolean
  created_at: string
  updated_at: string
  profiles?: Profile
}