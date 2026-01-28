// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CareConnect - Minnesota 245D Care Provider Network',
  description: 'Find verified 245D licensed care facilities and services in Minnesota. Connect with quality providers accepting CADI, DD, BI, and Elderly waivers.',
  keywords: 'HCBS, 245D, care facilities, Minnesota, CADI, DD waiver, elderly care, assisted living, disability services',
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
        {/* Navigation - Tan/Brown Background */}
        <nav className="shadow-lg sticky top-0 z-50" style={{ backgroundColor: '#EDE4D3' }}>
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo - Keep blue */}
              <Link href="/" className="flex items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-blue-600">Care</span>
                    <span className="text-xl font-bold text-[#5C4A32]">Connect</span>
                  </div>
                </div>
              </Link>

              {/* Client-side Navigation Component */}
              <Navigation initialUser={user} initialRole={userRole} />

              {/* Mobile Menu Button */}
              <button className="md:hidden mobile-menu-button text-[#5C4A32]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="mobile-menu hidden md:hidden pb-4">
              <Link href="/browse" className="block px-3 py-2 text-[#5C4A32] hover:bg-[#D4C4A8] rounded">Browse Providers</Link>
              <Link href="/services" className="block px-3 py-2 text-[#5C4A32] hover:bg-[#D4C4A8] rounded">Our Services</Link>
              <Link href="/about" className="block px-3 py-2 text-[#5C4A32] hover:bg-[#D4C4A8] rounded">About 245D</Link>
              <Link href="/contact" className="block px-3 py-2 text-[#5C4A32] hover:bg-[#D4C4A8] rounded">Contact</Link>
              <div className="border-t border-[#D4C4A8] mt-2 pt-2">
                {user ? (
                  <>
                    <Link href="/dashboard" className="block px-3 py-2 text-[#5C4A32] hover:bg-[#D4C4A8] rounded">Dashboard</Link>
                    <form action="/auth/logout" method="POST">
                      <button className="block w-full text-left px-3 py-2 text-[#5C4A32] hover:bg-[#D4C4A8] rounded">
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="block px-3 py-2 text-[#5C4A32] hover:bg-[#D4C4A8] rounded">Sign In</Link>
                    <Link href="/auth/register-care-seeker" className="block px-3 py-2 bg-green-600 text-white hover:bg-green-700 mx-3 rounded mb-2">
                      Find Care
                    </Link>
                    <Link href="/auth/register" className="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 mx-3 rounded">
                      List Your Facility
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          {children}
        </main>

        {/* Footer - Light Tan Background */}
        <footer className="py-12" style={{ backgroundColor: '#EDE4D3' }}>
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Company Info */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-blue-600">CareConnect</span>
                    <p className="text-xs text-gray-600">245D Provider Network</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Connecting Minnesota families with quality 245D licensed care providers.
                </p>
              </div>

              {/* For Care Seekers */}
              <div>
                <h4 className="font-bold mb-4 text-blue-600">For Families</h4>
                <ul className="space-y-2">
                  <li><Link href="/browse" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Browse Providers</Link></li>
                  <li><Link href="/auth/register-care-seeker" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Create Account</Link></li>
                  <li><Link href="/about#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">How It Works</Link></li>
                  <li><Link href="/resources" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Resources</Link></li>
                </ul>
              </div>

              {/* For Providers */}
              <div>
                <h4 className="font-bold mb-4 text-blue-600">For Providers</h4>
                <ul className="space-y-2">
                  <li><Link href="/auth/register" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Join Network</Link></li>
                  <li><Link href="/providers/requirements" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Requirements</Link></li>
                  <li><Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Provider Login</Link></li>
                </ul>
              </div>

              {/* Contact & Support */}
              <div>
                <h4 className="font-bold mb-4 text-blue-600">Support</h4>
                <p className="text-gray-600 mb-2 font-medium">
                  <a href="mailto:careconnectmkting@gmail.com" className="hover:text-blue-600 transition-colors">
                    careconnectmkting@gmail.com
                  </a>
                </p>
                <p className="text-gray-600 text-sm mb-4 font-medium">
                  Monday - Friday: 8AM - 5PM CST
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-blue-600 font-bold">Waiver Types Supported:</p>
                  <ul className="ml-2 text-gray-600 font-medium">
                    <li>• CADI Waiver</li>
                    <li>• DD Waiver</li>
                    <li>• BI Waiver</li>
                    <li>• Elderly Waiver</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-[#D4C4A8] mt-8 pt-8 text-center text-sm">
              <p className="text-gray-600 font-medium">&copy; 2025 CareConnect Minnesota. All rights reserved.</p>
              <p className="mt-2">
                <Link href="/privacy" className="text-gray-600 hover:text-blue-600 font-medium">Privacy Policy</Link>
                <span className="mx-2 text-[#D4C4A8]">|</span>
                <Link href="/terms" className="text-gray-600 hover:text-blue-600 font-medium">Terms of Service</Link>
                <span className="mx-2 text-[#D4C4A8]">|</span>
                <Link href="/hipaa" className="text-gray-600 hover:text-blue-600 font-medium">HIPAA Compliance</Link>
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