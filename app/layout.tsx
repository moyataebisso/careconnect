// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CareConnect Marketing Agency - Quality Care for Minnesota',
  description: 'Connecting quality care with those who need it most. Find 245D licensed care facilities in Minnesota.',
  keywords: 'HCBS, 245D, care facilities, Minnesota, CADI, DD waiver, elderly care, assisted living',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Check if user is admin
  let isAdmin = false
  if (user) {
    // Check admin_users table
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    // Also check profiles table as backup
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    // User is admin if they have a role in admin_users OR is_admin in profiles
    isAdmin = !!(adminUser?.role || profile?.is_admin)
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
                  {/* CareConnect Logo */}
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      {/* Leaf/Plant icon similar to logo */}
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
                <Link href="/providers" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Find Care
                </Link>
                <Link href="/booking" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Book Service
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
                    <Link href="/my-bookings" className="text-gray-700 hover:text-blue-600 font-medium">
                      My Bookings
                    </Link>
                    <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                      Dashboard
                    </Link>
                    <form action="/auth/logout" method="POST">
                      <button className="text-gray-700 hover:text-blue-600 font-medium">
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/my-bookings" className="text-gray-700 hover:text-blue-600 font-medium">
                      My Bookings
                    </Link>
                    <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                      Provider Login
                    </Link>
                    <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Join as Provider
                    </Link>
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
              <Link href="/providers" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Find Care</Link>
              <Link href="/booking" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Book Service</Link>
              <Link href="/my-bookings" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">My Bookings</Link>
              <Link href="/services" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Our Services</Link>
              <Link href="/about" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">About 245D</Link>
              <Link href="/contact" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Contact</Link>
              {isAdmin && (
                <Link href="/admin" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Admin</Link>
              )}
              <div className="border-t border-gray-200 mt-2 pt-2">
                {user ? (
                  <>
                    <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Dashboard</Link>
                    <form action="/auth/logout" method="POST">
                      <button className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100">
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Provider Login</Link>
                    <Link href="/register" className="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 mx-3 rounded">
                      Join as Provider
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-h-screen bg-gray-50">
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
                    <p className="text-xs text-gray-400">Marketing Agency</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Connecting quality care with those who need it most.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Specializing in 245D/HCBS services across Minnesota.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/providers" className="hover:text-white transition-colors">Find Care Facilities</Link></li>
                  <li><Link href="/booking" className="hover:text-white transition-colors">Book a Service</Link></li>
                  <li><Link href="/my-bookings" className="hover:text-white transition-colors">My Bookings</Link></li>
                  <li><Link href="/services" className="hover:text-white transition-colors">Our Services</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">About 245D</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Provider Registration</Link></li>
                </ul>
              </div>

              {/* Waiver Types */}
              <div>
                <h4 className="font-semibold mb-4">Waiver Programs</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>CADI - Community Access</li>
                  <li>DD - Developmental Disabilities</li>
                  <li>BI - Brain Injury</li>
                  <li>Elderly Waiver (65+)</li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-semibold mb-4">Contact Us</h4>
                <p className="text-gray-400 mb-2">
                  <a href="mailto:careconnectmkting@gmail.com" className="hover:text-white transition-colors">
                    careconnectmkting@gmail.com
                  </a>
                </p>
                <p className="text-gray-400 text-sm">
                  Minnesota trusted 245D referral service
                </p>
                <div className="flex space-x-4 mt-4">
                  {/* Social Media Placeholder */}
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
              <p>&copy; 2024 CareConnect Marketing Agency. All rights reserved.</p>
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