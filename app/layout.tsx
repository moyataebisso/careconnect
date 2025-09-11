// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
  
  // Check user role
  let userRole: 'admin' | 'provider' | 'care_seeker' | null = null
  let isAdmin = false
  
  if (user) {
    // Check user_roles table first (new system)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (roleData) {
      userRole = roleData.role as 'admin' | 'provider' | 'care_seeker'
      isAdmin = roleData.role === 'admin'
    } else {
      // Fallback: Check admin_users table (legacy)
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (adminUser) {
        userRole = 'admin'
        isAdmin = true
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
      <body className={inter.className}>
        {/* Navigation */}
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-blue-900">Care</span>
                    <span className="text-xl font-bold text-gray-700">Connect</span>
                  </div>
                </div>
              </Link>

              {/* Main Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/browse" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Browse Providers
                </Link>
                <Link href="/services" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Our Services
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  About Us
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Contact
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                    Admin
                  </Link>
                )}
              </div>

              {/* Auth Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <>
                    {/* Show different options based on user role */}
                    {userRole === 'care_seeker' && (
                      <>
                        <Link href="/care-seeker/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                          Dashboard
                        </Link>
                        <Link href="/my-bookings" className="text-gray-700 hover:text-blue-600 font-medium">
                          My Bookings
                        </Link>
                        <Link href="/care-seeker/saved" className="text-gray-700 hover:text-blue-600 font-medium">
                          Saved
                        </Link>
                      </>
                    )}
                    {userRole === 'provider' && (
                      <>
                        <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                          Provider Dashboard
                        </Link>
                        <Link href="/dashboard/inquiries" className="text-gray-700 hover:text-blue-600 font-medium">
                          Inquiries
                        </Link>
                      </>
                    )}
                    {userRole === 'admin' && (
                      <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                        Dashboard
                      </Link>
                    )}
                    <form action="/auth/logout" method="POST">
                      <button className="text-gray-700 hover:text-blue-600 font-medium">
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 font-medium">
                      Sign In
                    </Link>
                    <div className="flex items-center space-x-2">
                      <Link href="/auth/register-care-seeker" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                        Find Care
                      </Link>
                      <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        List Your Facility
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button className="md:hidden mobile-menu-button">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="mobile-menu hidden md:hidden pb-4">
              <Link href="/browse" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Browse Providers</Link>
              <Link href="/services" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Our Services</Link>
              <Link href="/about" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">About 245D</Link>
              <Link href="/contact" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Contact</Link>
              {isAdmin && (
                <Link href="/admin" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Admin</Link>
              )}
              <div className="border-t border-gray-200 mt-2 pt-2">
                {user ? (
                  <>
                    {userRole === 'care_seeker' && (
                      <>
                        <Link href="/care-seeker/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Dashboard</Link>
                        <Link href="/my-bookings" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">My Bookings</Link>
                        <Link href="/care-seeker/saved" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Saved Providers</Link>
                      </>
                    )}
                    {userRole === 'provider' && (
                      <>
                        <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Provider Dashboard</Link>
                        <Link href="/dashboard/inquiries" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Inquiries</Link>
                      </>
                    )}
                    <form action="/auth/logout" method="POST">
                      <button className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100">
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Sign In</Link>
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
        <main className="bg-gray-50">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
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
                    <span className="text-lg font-bold">CareConnect</span>
                    <p className="text-xs text-gray-400">245D Provider Network</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Connecting Minnesota families with quality 245D licensed care providers.
                </p>
              </div>

              {/* For Care Seekers */}
              <div>
                <h4 className="font-semibold mb-4">For Families</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/browse" className="hover:text-white transition-colors">Browse Providers</Link></li>
                  <li><Link href="/auth/register-care-seeker" className="hover:text-white transition-colors">Create Account</Link></li>
                  <li><Link href="/about#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                  <li><Link href="/resources" className="hover:text-white transition-colors">Resources</Link></li>
                </ul>
              </div>

              {/* For Providers */}
              <div>
                <h4 className="font-semibold mb-4">For Providers</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/auth/register" className="hover:text-white transition-colors">Join Network</Link></li>
                  <li><Link href="/providers/benefits" className="hover:text-white transition-colors">Benefits</Link></li>
                  <li><Link href="/providers/requirements" className="hover:text-white transition-colors">Requirements</Link></li>
                  <li><Link href="/dashboard" className="hover:text-white transition-colors">Provider Login</Link></li>
                </ul>
              </div>

              {/* Contact & Support */}
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <p className="text-gray-400 mb-2">
                  <a href="mailto:support@careconnect-mn.com" className="hover:text-white transition-colors">
                    careconnectmkting@gmail.com
                  </a>
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Monday - Friday: 8AM - 5PM CST
                </p>
                <div className="space-y-2 text-gray-400 text-sm">
                  <p>Waiver Types Supported:</p>
                  <ul className="ml-2">
                    <li>• CADI Waiver</li>
                    <li>• DD Waiver</li>
                    <li>• BI Waiver</li>
                    <li>• Elderly Waiver</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
              <p>&copy; 2025 CareConnect Minnesota. All rights reserved.</p>
              <p className="mt-2">
                <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                <span className="mx-2">|</span>
                <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                <span className="mx-2">|</span>
                <Link href="/hipaa" className="hover:text-white">HIPAA Compliance</Link>
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