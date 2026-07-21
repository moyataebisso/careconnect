import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Family Residential Services (FRS) Providers Minnesota',
  description:
    'Find 245D licensed Family Residential Service providers in Minnesota accepting waiver clients. Verified listings, current openings.',
}

export default function FrsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0FDF4' }}>
      <section style={{ background: '#1B4332' }} className="py-16">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>245D Service Type</p>
          <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            Family Residential Services (FRS) Providers in Minnesota
          </h1>
          <p className="text-lg" style={{ color: '#B7E4C7' }}>
            Verified 245D licensed FRS providers offering habilitation and care in family-operated licensed homes
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8" style={{ borderColor: '#D1FAE5' }}>
            <p className="text-gray-700 leading-relaxed mb-4">
              Family Residential Services (FRS) is a 245D licensed intensive support service in Minnesota where an individual lives in a licensed foster family home with a caregiver who provides 24-hour habilitation, personal support, and coordination of care. FRS is typically funded through the DD, CADI, or BI waivers and serves people who need a small, family-style residential setting.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect lists verified FRS providers across Minnesota with current openings for waiver-approved clients. Every FRS listing on our directory is operated by a 245D licensed provider that has been reviewed for active licensure and accepting-clients status.
            </p>
            <p className="text-gray-700 leading-relaxed">
              With the DHS 245D licensing moratorium in effect through December 2027, no new FRS providers are being licensed. Existing licensed FRS operators are the only path to placement — browse verified providers with current openings below.
            </p>
          </div>

          <div className="text-center mb-12">
            <Link
              href="/providers?service=FRS"
              className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90"
              style={{ background: '#1B4332' }}
            >
              Browse FRS Providers →
            </Link>
          </div>

          <div className="rounded-2xl p-8 text-center" style={{ background: '#1B4332' }}>
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>For Providers</p>
            <h2 className="text-2xl font-black text-white mb-3" style={{ letterSpacing: '-0.01em' }}>
              Licensed for Family Residential Services?
            </h2>
            <p className="mb-6" style={{ color: '#B7E4C7' }}>
              List your FRS home on CareConnect and get in front of case managers and families actively searching for licensed placements.
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
