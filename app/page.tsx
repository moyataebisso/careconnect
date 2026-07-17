// app/page.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProviderTutorialSlideshow from '@/components/ProviderTutorialSlideshow'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/providers?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* HERO — dark forest green, bold left-aligned headline, search right side */}
      <section style={{ background: '#1B4332', minHeight: '580px' }} className="relative flex items-center">
        <div className="container mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Left: headline */}
            <div className="lg:w-1/2 text-white">
              <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#95D5B2' }}>
                Minnesota 245D / HCBS Network
              </p>
              <h1 className="font-black leading-none mb-6" style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', letterSpacing: '-0.02em' }}>
                Real care.<br />
                Real providers.<br />
                <span style={{ color: '#95D5B2' }}>Right here.</span>
              </h1>
              <p className="text-lg mb-8" style={{ color: '#B7E4C7', maxWidth: '420px', lineHeight: '1.7' }}>
                Connect with licensed 245D providers across Minnesota — verified, waiver-ready, and accepting referrals.
              </p>
              <div className="flex flex-wrap gap-3">
                {['CADI Waiver', 'DD Waiver', 'Brain Injury', 'Elderly', 'Assisted Living', 'Home Health'].map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: 'rgba(149,213,178,0.15)', color: '#95D5B2', border: '1px solid rgba(149,213,178,0.3)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: search card */}
            <div className="lg:w-1/2 w-full">
              <div className="rounded-2xl p-8 shadow-2xl" style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <h2 className="text-white text-2xl font-bold mb-6">Find the right care</h2>
                <form onSubmit={handleSearch} className="space-y-4">
                  <input
                    type="text"
                    placeholder="City, neighborhood, or ZIP code"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl text-gray-900 text-base focus:outline-none focus:ring-2"
                    style={{ background: 'white' }}
                  />
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.99]"
                    style={{ background: '#95D5B2', color: '#1B4332' }}
                  >
                    Search Providers
                  </button>
                </form>
                <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-xs mb-3" style={{ color: '#B7E4C7' }}>BROWSE BY SERVICE</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Family Residential', href: '/providers?service=FRS' },
                      { label: 'Community Residential', href: '/providers?service=CRS' },
                      { label: 'Home Supports', href: '/providers?service=IHS' },
                      { label: 'Assisted Living', href: '/providers?service=ASSISTED_LIVING' },
                    ].map(item => (
                      <Link key={item.href} href={item.href}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white hover:text-green-900"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR — white, clean stats */}
      <section className="bg-white border-b" style={{ borderColor: '#E8F5E9' }}>
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-black" style={{ color: '#1B4332' }}>245D</div>
              <div className="text-sm text-gray-500 mt-1">Licensed Providers Only</div>
            </div>
            <div>
              <div className="text-3xl font-black" style={{ color: '#1B4332' }}>4</div>
              <div className="text-sm text-gray-500 mt-1">Waiver Programs Supported</div>
            </div>
            <div>
              <div className="text-3xl font-black" style={{ color: '#1B4332' }}>MN</div>
              <div className="text-sm text-gray-500 mt-1">Statewide Coverage</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS — white background, coral accent icons like Care.com */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-3" style={{ color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            What kind of care are you looking for?
          </h2>
          <p className="text-center text-gray-500 mb-12">All providers are licensed under Minnesota 245D program standards</p>

          {/* Basic 245D */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: '#E8F5E9', color: '#1B4332' }}>Basic Support Services</span>
              <div className="flex-1 h-px" style={{ background: '#E8F5E9' }}></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Integrated Community Supports', short: 'ICS', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
                { label: 'Individualized Home Supports', short: 'IHS', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
                { label: 'Respite Care', short: 'RESPITE', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
                { label: 'Adult Day Services', short: 'ADULT_DAY', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
                { label: 'Homemaker Services', short: 'HOMEMAKER', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
                { label: 'Night Supervision', short: 'NIGHT_SUP', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> },
              ].map(item => (
                <Link key={item.short} href={`/providers?service=${item.short}`}
                  className="flex flex-col items-center p-5 rounded-2xl border text-center transition-all hover:-translate-y-1 hover:shadow-md group"
                  style={{ borderColor: '#E8F5E9', background: 'white' }}>
                  <div className="mb-3" style={{ color: '#1B4332' }}>{item.svg}</div>
                  <span className="text-xs font-semibold text-gray-700 leading-tight group-hover:text-green-800">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Intensive 245D */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#4C1D95' }}>Intensive Support Services</span>
              <div className="flex-1 h-px" style={{ background: '#EDE9FE' }}></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Family Residential Services', short: 'FRS', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
                { label: 'Community Residential Services', short: 'CRS', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                { label: 'Day Training & Habilitation', short: 'DTH', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
              ].map(item => (
                <Link key={item.short} href={`/providers?service=${item.short}`}
                  className="flex flex-col items-center p-5 rounded-2xl border text-center transition-all hover:-translate-y-1 hover:shadow-md group"
                  style={{ borderColor: '#EDE9FE', background: 'white' }}>
                  <div className="mb-3" style={{ color: '#4C1D95' }}>{item.svg}</div>
                  <span className="text-xs font-semibold text-gray-700 leading-tight group-hover:text-purple-800">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Additional Care */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: '#F3F4F6', color: '#374151' }}>Additional Care Services</span>
              <div className="flex-1 h-px" style={{ background: '#F3F4F6' }}></div>
              <span className="text-xs text-gray-400">Licensed by MN Dept of Health</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Assisted Living', short: 'ASSISTED_LIVING', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                { label: 'Home Health Care', short: 'HOME_HEALTH', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 0v4m0-4h4m-4 0H8" /></svg> },
              ].map(item => (
                <Link key={item.short} href={`/providers?service=${item.short}`}
                  className="flex flex-col items-center p-5 rounded-2xl border text-center transition-all hover:-translate-y-1 hover:shadow-md group"
                  style={{ borderColor: '#E5E7EB', background: 'white' }}>
                  <div className="mb-3 text-gray-400">{item.svg}</div>
                  <span className="text-xs font-semibold text-gray-700 leading-tight group-hover:text-gray-900">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — dark green */}
      <section className="py-20" style={{ background: '#1B4332' }}>
        <div className="container mx-auto px-6">
          <div className="rounded-2xl px-8 py-6 shadow-sm max-w-2xl mx-auto mb-12 text-center text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <h2 className="text-2xl font-black text-white">How It Works for Providers</h2>
            <p className="mt-2" style={{ color: '#B7E4C7' }}>Join CareConnect in 5 simple steps and start receiving qualified referrals</p>
          </div>
          <ProviderTutorialSlideshow variant="medium" />
        </div>
      </section>

      {/* FEATURED PHOTOS */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2940&auto=format&fit=crop', title: 'Professional Care', sub: 'Experienced, licensed caregivers' },
              { img: 'https://images.unsplash.com/photo-1559234938-b60fff04894d?q=80&w=2940&auto=format&fit=crop', title: 'Home-Like Settings', sub: 'Comfortable, welcoming environments' },
              { img: 'https://images.unsplash.com/photo-1543333995-a78aea2eee50?q=80&w=2940&auto=format&fit=crop', title: 'Community Support', sub: 'Engaging activities and programs' },
            ].map(card => (
              <div key={card.title} className="relative h-64 rounded-2xl overflow-hidden shadow-md group">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${card.img}')` }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />
                <div className="absolute bottom-0 left-0 p-5 text-white">
                  <h3 className="text-lg font-bold mb-0.5">{card.title}</h3>
                  <p className="text-sm opacity-80">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOR PROVIDERS */}
      <section className="py-20 relative overflow-hidden" style={{ background: '#1B4332' }}>
        <div className="container mx-auto px-6 text-center text-white relative z-10">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#95D5B2' }}>For 245D Licensed Providers</p>
          <h2 className="text-4xl font-black mb-4" style={{ letterSpacing: '-0.02em' }}>Are you a 245D licensed provider?</h2>
          <p className="text-lg mb-8" style={{ color: '#B7E4C7' }}>Join CareConnect to receive qualified waiver-based referrals from case managers and social workers across Minnesota</p>
          <Link href="/auth/register"
            className="inline-block px-10 py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90"
            style={{ background: '#95D5B2', color: '#1B4332' }}>
            Get Started Today
          </Link>
        </div>
      </section>

      {/* HOW REFERRAL SYSTEM WORKS */}
      <section className="py-20" style={{ background: '#F0FDF4' }}>
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12" style={{ color: '#1a1a1a', letterSpacing: '-0.02em' }}>How Our Referral System Works</h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-4 gap-8">
            {[
              { n: '1', title: 'Initial Contact', desc: 'Reach out through our platform' },
              { n: '2', title: 'Profile Creation', desc: 'Build your professional presence' },
              { n: '3', title: 'Outreach Launch', desc: 'Begin targeted marketing' },
              { n: '4', title: 'Lead Delivery', desc: 'Receive qualified referrals' },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-black" style={{ background: '#E8F5E9', color: '#1B4332' }}>{step.n}</div>
                <h3 className="font-bold mb-1 text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-12 max-w-2xl mx-auto">
            Our proven system connects you with social workers, discharge planners, and case managers who are actively seeking quality 245D licensed housing solutions for their waiver clients.
          </p>
          <div className="text-center mt-8">
            <Link href="/providers"
              className="inline-block px-8 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
              style={{ background: '#1B4332', color: 'white' }}>
              Browse Available Providers
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16" style={{ background: '#DCFCE7' }}>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-3" style={{ color: '#1B4332', letterSpacing: '-0.02em' }}>Ready to Find Quality Care?</h2>
          <p className="mb-8" style={{ color: '#1B4332' }}>Search our network of verified 245D providers across Minnesota</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/providers"
              className="inline-block px-8 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#1B4332' }}>
              Find Care Now
            </Link>
            <Link href="/contact"
              className="inline-block px-8 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
              style={{ border: '2px solid #1B4332', color: '#1B4332', background: 'white' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
