// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'
import { CareConnectJsonLd } from '@/app/components/CareConnectJsonLd'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'CareConnect — Minnesota 245D Care Provider Network',
    template: '%s | CareConnect Minnesota',
  },
  description:
    'Find verified 245D licensed care providers across Minnesota. Search by waiver type (CADI, DD, BI, Elderly), service type, and county. The most complete HCBS provider directory in MN.',
  keywords: [
    '245D provider Minnesota',
    'CADI waiver provider Minneapolis',
    'DD waiver group home Minnesota',
    'HCBS provider directory MN',
    'CareConnect Minnesota',
    '245D licensed care facility',
    'home care waiver MN',
  ],
  metadataBase: new URL('https://careconnectlive.org'),
  openGraph: {
    title: 'CareConnect — Minnesota 245D Provider Network',
    description:
      'Verified 245D licensed providers accepting CADI, DD, BI, and Elderly waiver clients across Minnesota.',
    url: 'https://careconnectlive.org',
    siteName: 'CareConnect Minnesota',
    locale: 'en_US',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check user role for initial state
  let userRole: 'admin' | 'provider' | 'care_seeker' | null = null
  
  if (user) {
    // Check user_roles table first (new system)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (roleData) {
      userRole = roleData.role as 'admin' | 'provider' | 'care_seeker'
    } else {
      // Fallback: Check admin_users table (legacy)
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (adminUser) {
        userRole = 'admin'
      } else {
        // Check if they're a provider (legacy)
        const { data: provider } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (provider) {
          userRole = 'provider'
        }
      }
    }
  }
    
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
        <CareConnectJsonLd />
        <nav className="sticky top-0 z-50 px-4 py-3" style={{ background: '#f8f6f1' }}>
          <div
            className="mx-auto flex items-center justify-between px-6"
            style={{
              background: '#1B4332',
              borderRadius: '9999px',
              height: '64px',
              maxWidth: '1200px',
              boxShadow: '0 4px 24px rgba(27,67,50,0.18)',
            }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#95D5B2' }}>
                <svg className="w-5 h-5" fill="#1B4332" viewBox="0 0 24 24">
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                </svg>
              </div>
              <span className="text-white font-black text-lg tracking-tight">CareConnect</span>
            </Link>

            {/* Center nav links - desktop only */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/browse" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#B7E4C7' }}>
                Browse Providers
              </Link>
              <Link href="/services" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#B7E4C7' }}>
                Our Services
              </Link>
              <Link href="/about" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#B7E4C7' }}>
                About Us
              </Link>
              <Link href="/contact" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#B7E4C7' }}>
                Contact
              </Link>
              {userRole === 'admin' && (
                <Link href="/admin" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#B7E4C7' }}>
                  Admin
                </Link>
              )}
            </div>

            {/* Right side auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {(userRole === 'provider' || userRole === 'admin') && (
                    <Link href="/dashboard" className="text-sm font-medium" style={{ color: '#B7E4C7' }}>
                      Dashboard
                    </Link>
                  )}
                  {userRole === 'care_seeker' && (
                    <Link href="/care-seeker/dashboard" className="text-sm font-medium" style={{ color: '#B7E4C7' }}>
                      Dashboard
                    </Link>
                  )}
                  <form action="/auth/logout" method="POST">
                    <button className="text-sm font-medium px-4 py-2 rounded-full transition-all hover:opacity-80" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-medium" style={{ color: '#B7E4C7' }}>
                    Sign In
                  </Link>
                  <Link href="/auth/register-care-seeker"
                    className="text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:opacity-90"
                    style={{ background: '#95D5B2', color: '#1B4332' }}>
                    Find Care
                  </Link>
                  <Link href="/auth/register"
                    className="text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:opacity-90"
                    style={{ background: 'white', color: '#1B4332' }}>
                    List Your Facility
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden mobile-menu-button text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile dropdown */}
          <div className="mobile-menu hidden md:hidden mt-2 rounded-2xl p-4" style={{ background: '#1B4332' }}>
            <Link href="/browse" className="block px-4 py-2.5 rounded-xl text-sm font-medium mb-1 hover:bg-white/10" style={{ color: '#B7E4C7' }}>Browse Providers</Link>
            <Link href="/services" className="block px-4 py-2.5 rounded-xl text-sm font-medium mb-1 hover:bg-white/10" style={{ color: '#B7E4C7' }}>Our Services</Link>
            <Link href="/about" className="block px-4 py-2.5 rounded-xl text-sm font-medium mb-1 hover:bg-white/10" style={{ color: '#B7E4C7' }}>About Us</Link>
            <Link href="/contact" className="block px-4 py-2.5 rounded-xl text-sm font-medium mb-4 hover:bg-white/10" style={{ color: '#B7E4C7' }}>Contact</Link>
            <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {user ? (
                <>
                  <Link href="/dashboard" className="block px-4 py-2.5 rounded-xl text-sm font-medium mb-1 hover:bg-white/10" style={{ color: '#B7E4C7' }}>Dashboard</Link>
                  <form action="/auth/logout" method="POST">
                    <button className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10" style={{ color: '#B7E4C7' }}>Sign Out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block px-4 py-2.5 rounded-xl text-sm font-medium mb-2 hover:bg-white/10" style={{ color: '#B7E4C7' }}>Sign In</Link>
                  <Link href="/auth/register-care-seeker" className="block px-4 py-2.5 rounded-xl text-sm font-bold text-center mb-2" style={{ background: '#95D5B2', color: '#1B4332' }}>Find Care</Link>
                  <Link href="/auth/register" className="block px-4 py-2.5 rounded-xl text-sm font-bold text-center" style={{ background: 'white', color: '#1B4332' }}>List Your Facility</Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          {children}
        </main>

        <footer style={{ background: '#1B4332' }} className="py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#95D5B2' }}>
                    <svg className="w-5 h-5" fill="#1B4332" viewBox="0 0 24 24">
                      <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-white font-black text-lg">CareConnect</span>
                    <p className="text-xs" style={{ color: '#95D5B2' }}>245D Provider Network</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#B7E4C7' }}>
                  Connecting Minnesota families with quality 245D licensed care providers.
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-4" style={{ color: '#95D5B2' }}>For Families</h4>
                <ul className="space-y-2">
                  <li><Link href="/browse" className="text-sm transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>Browse Providers</Link></li>
                  <li><Link href="/auth/register-care-seeker" className="text-sm transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>Create Account</Link></li>
                  <li><Link href="/about#how-it-works" className="text-sm transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>How It Works</Link></li>
                  <li><Link href="/resources" className="text-sm transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>Resources</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-4" style={{ color: '#95D5B2' }}>For Providers</h4>
                <ul className="space-y-2">
                  <li><Link href="/auth/register" className="text-sm transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>Join Network</Link></li>
                  <li><Link href="/providers/requirements" className="text-sm transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>Requirements</Link></li>
                  <li><Link href="/dashboard" className="text-sm transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>Provider Login</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-4" style={{ color: '#95D5B2' }}>Support</h4>
                <p className="text-sm mb-1">
                  <a href="mailto:careconnectmkting@gmail.com" className="transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>
                    careconnectmkting@gmail.com
                  </a>
                </p>
                <p className="text-sm mb-4" style={{ color: '#B7E4C7' }}>Monday - Friday: 8AM - 5PM CST</p>
                <div className="space-y-1 text-sm">
                  <p className="font-bold mb-2" style={{ color: '#95D5B2' }}>Waiver Types Supported:</p>
                  <ul className="space-y-1" style={{ color: '#B7E4C7' }}>
                    <li>• CADI Waiver</li>
                    <li>• DD Waiver</li>
                    <li>• BI Waiver</li>
                    <li>• Elderly Waiver</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 text-center text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: '#B7E4C7' }}>&copy; 2026 CareConnect Minnesota. All rights reserved.</p>
              <p className="mt-2 flex justify-center gap-4">
                <Link href="/privacy" className="transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>Privacy Policy</Link>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <Link href="/terms" className="transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>Terms of Service</Link>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <Link href="/hipaa" className="transition-colors hover:text-white" style={{ color: '#B7E4C7' }}>HIPAA Compliance</Link>
              </p>
            </div>
          </div>
        </footer>
        
        {/* Mobile Menu Toggle Script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const btn = document.querySelector('.mobile-menu-button');
              const menu = document.querySelector('.mobile-menu');
              
              if (btn && menu) {
                btn.addEventListener('click', () => {
                  menu.classList.toggle('hidden');
                });
              }
            });
          `
        }} />
      </body>
    </html>
  )
}