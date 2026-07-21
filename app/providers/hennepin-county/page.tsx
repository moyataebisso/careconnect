import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '245D Providers in Hennepin County, MN',
  description:
    'Find verified 245D licensed care facilities and HCBS providers in Hennepin County, Minnesota. CADI, DD, BI, and Elderly waiver accepted.',
}

export default function HennepinCountyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0FDF4' }}>
      <section style={{ background: '#1B4332' }} className="py-16">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>Service Area</p>
          <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            245D Providers in Hennepin County, MN
          </h1>
          <p className="text-lg" style={{ color: '#B7E4C7' }}>
            Verified licensed HCBS providers across Minneapolis and the western Twin Cities metro
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8" style={{ borderColor: '#D1FAE5' }}>
            <p className="text-gray-700 leading-relaxed mb-4">
              Hennepin County is home to Minnesota&apos;s largest concentration of 245D licensed providers, spanning Minneapolis, Bloomington, Brooklyn Park, Plymouth, Eden Prairie, Maple Grove, and dozens more communities. Case managers and families searching for waiver-approved care in Hennepin County face growing demand for a limited pool of licensed operators — especially since the DHS licensing moratorium took effect in January 2026.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect lists verified 245D licensed providers offering Integrated Community Supports (ICS), Individualized Home Supports (IHS), Family Residential Services (FRS), Community Residential Services (CRS), Adult Day Services, Respite Care, and more. All providers in our directory accept one or more waiver types: CADI, DD, BI, or Elderly.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you&apos;re a case manager placing a client, a family member searching for the right residential setting, or a discharge planner coordinating post-hospital care, browse Hennepin County providers with current openings below.
            </p>
          </div>

          <div className="text-center mb-12">
            <Link
              href="/providers?county=hennepin"
              className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90"
              style={{ background: '#1B4332' }}
            >
              Browse Hennepin County Providers →
            </Link>
          </div>

          <div className="rounded-2xl p-8 text-center" style={{ background: '#1B4332' }}>
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>For Providers</p>
            <h2 className="text-2xl font-black text-white mb-3" style={{ letterSpacing: '-0.01em' }}>
              Serving Hennepin County families?
            </h2>
            <p className="mb-6" style={{ color: '#B7E4C7' }}>
              Get in front of case managers, social workers, and discharge planners actively searching for verified providers.
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
