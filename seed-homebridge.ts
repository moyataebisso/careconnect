import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase URL and service key
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseServiceKey = 'YOUR_SERVICE_KEY'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed() {
  console.log('Seeding HomeBridge MN database...')

  // Create test user
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: 'provider@homebridgemn.org',
    password: 'provider123',
    email_confirm: true
  })

  if (userError) {
    console.error('Error creating user:', userError)
    return
  }

  // Create profile
  await supabase.from('profiles').insert({
    id: user.user.id,
    email: 'provider@homebridgemn.org',
    full_name: 'Test Provider',
    phone: '612-555-0100',
    company: 'Safe Harbor Care Home',
    role: 'provider'
  })

  // Create sample listings
  const listings = [
    {
      title: 'Safe Harbor Residential Care - Apple Valley',
      slug: 'safe-harbor-apple-valley',
      description: 'Licensed assisted living facility providing 24-hour customized care for seniors and adults with disabilities. Our home-like environment offers personalized care plans, medication management, and daily living assistance.',
      category: 'assisted_living',
      status: 'active',
      address: '13607 Fordham Ave',
      city: 'Apple Valley',
      county: 'Dakota',
      state: 'MN',
      zip_code: '55124',
      contact_person: 'Meeka Singh, LPN',
      contact_phone: '952-451-9469',
      contact_email: 'info@safeharbor.com',
      website: 'https://safeharbor.com',
      capacity: 5,
      current_openings: 2,
      age_range: '55+',
      services: ['24-Hour Care', 'Medication Management', 'Meal Services', 'Transportation', 'Personal Care'],
      languages_spoken: ['English', 'Spanish', 'Somali'],
      funding_accepted: ['Medical Assistance', 'Elderly Waiver', 'Private Pay', 'Long-term Care Insurance'],
      disabilities_served: ['Physical Disabilities', 'Memory Care', 'Mental Health', 'Chronic Illness'],
      license_type: 'Assisted Living',
      license_number: 'AL-2024-001',
      business_hours: 'Visits by appointment, 24/7 care',
      user_id: user.user.id,
      featured: true
    },
    {
      title: 'Caring Hands Foster Care - New Brighton',
      slug: 'caring-hands-new-brighton',
      description: 'Family-style adult foster care home specializing in developmental disabilities. We provide person-centered support in a warm, homelike environment with focus on community integration.',
      category: 'foster_care',
      status: 'active',
      address: '622 17th Ave NW',
      city: 'New Brighton',
      county: 'Ramsey',
      state: 'MN',
      zip_code: '55112',
      contact_person: 'Sarah Johnson, RN',
      contact_phone: '651-633-1234',
      contact_email: 'info@caringhands.com',
      capacity: 4,
      current_openings: 1,
      age_range: '18-65',
      services: ['Personal Care', 'Community Integration', 'Skills Training', 'Recreational Activities'],
      languages_spoken: ['English'],
      funding_accepted: ['DD Waiver', 'CADI Waiver', 'Private Pay'],
      disabilities_served: ['Developmental Disabilities', 'Autism', 'Down Syndrome'],
      license_type: 'Adult Foster Care',
      license_number: 'AFC-2024-002',
      business_hours: '24/7 care, visits welcome anytime',
      user_id: user.user.id
    }
  ]

  for (const listing of listings) {
    await supabase.from('listings').insert(listing)
  }

  console.log('✅ HomeBridge MN database seeded successfully!')
  console.log('Test account: provider@homebridgemn.org / provider123')
}

seed()