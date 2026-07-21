import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DD Waiver Providers in Minnesota',
  description:
    'Find verified providers accepting Developmental Disabilities (DD) waiver clients in Minnesota. 245D licensed care and residential services statewide.',
}

export default function DdWaiverPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0FDF4' }}>
      <section style={{ background: '#1B4332' }} className="py-16">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>Waiver Program</p>
          <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            DD Waiver Providers in Minnesota
          </h1>
          <p className="text-lg" style={{ color: '#B7E4C7' }}>
            Developmental Disabilities — verified 245D licensed providers accepting DD waiver clients statewide
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8" style={{ borderColor: '#D1FAE5' }}>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Developmental Disabilities (DD) waiver is a Minnesota Medicaid HCBS waiver serving people of all ages with a developmental disability or related condition who require the level of care provided in an Intermediate Care Facility for people with Developmental Disabilities (ICF/DD) — but choose to receive services in the community. DD waiver funding covers residential support, day services, employment support, and skill-building.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect lists verified 245D licensed providers accepting DD waiver clients across Minnesota. Services covered under DD and available through directory providers include Family Residential Services (FRS), Community Residential Services (CRS), Day Training &amp; Habilitation (DTH), Employment Support Services, Integrated Community Supports (ICS), Individualized Home Supports (IHS), and Respite Care.
            </p>
            <p className="text-gray-700 leading-relaxed">
              With the DHS 245D licensing moratorium in effect through December 2027, existing DD waiver providers are seeing heightened demand. Browse verified providers with current openings below.
            </p>
          </div>

          <div className="text-center mb-12">
            <Link
              href="/providers?waiver=DD"
              className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90"
              style={{ background: '#1B4332' }}
            >
              Browse DD Waiver Providers →
            </Link>
          </div>

          <div className="rounded-2xl p-8 text-center" style={{ background: '#1B4332' }}>
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>For Providers</p>
            <h2 className="text-2xl font-black text-white mb-3" style={{ letterSpacing: '-0.01em' }}>
              Accepting DD waiver clients?
            </h2>
            <p className="mb-6" style={{ color: '#B7E4C7' }}>
              List your 245D facility on CareConnect and get in front of case managers actively searching for DD-approved providers.
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-8 py-3 rounded-xl font-bold transition-all hover:opacity-90"
              style={{ background: '#95D5B2', color: '#1B4332' }}
            >
              List Your Facility — $99.99/mo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
