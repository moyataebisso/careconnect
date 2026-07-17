'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    console.log('Submitting form data:', formData)
    
    try {
      const supabase = createClient()
      
      // Save to contact_submissions table
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          organization: formData.organization || null,
          role: formData.role || null,
          message: formData.message,
          status: 'new'
        })
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Form submitted successfully')
      
      alert('Thank you for contacting us! We will respond within 24 hours.')
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        organization: '',
        role: '',
        message: ''
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Sorry, there was an error sending your message. Please try again or call us directly at 763-321-4542.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0FDF4' }}>

      {/* Hero */}
      <section style={{ background: '#1B4332' }} className="py-16">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>Get In Touch</p>
          <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>Contact CareConnect</h1>
          <p className="text-lg" style={{ color: '#B7E4C7' }}>We are here to help you grow your care business</p>
        </div>
      </section>

      {/* Main */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10">

            {/* Contact Info */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm p-8 mb-6" style={{ border: '1px solid #D1FAE5' }}>
                <h2 className="text-2xl font-black mb-6" style={{ color: '#1B4332' }}>Get In Touch</h2>
                <div className="space-y-5">
                  <div>
                    <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: '#1B4332' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#95D5B2' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      Call or Text
                    </h3>
                    <p className="text-gray-600"><a href="tel:763-321-4542" className="hover:underline">763-321-4542</a></p>
                    <p className="text-gray-600"><a href="tel:763-355-0711" className="hover:underline">763-355-0711</a></p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: '#1B4332' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#95D5B2' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Email
                    </h3>
                    <p className="text-gray-600"><a href="mailto:careconnectmkting@gmail.com" className="hover:underline">careconnectmkting@gmail.com</a></p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: '#1B4332' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#95D5B2' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Business Hours
                    </h3>
                    <div className="text-gray-600 text-sm space-y-0.5">
                      <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                      <p>Saturday: 9:00 AM - 2:00 PM</p>
                      <p>Sunday: Closed</p>
                      <p className="text-gray-400 mt-1">* Emergency referrals available 24/7</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: '#1B4332' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#95D5B2' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Service Area
                    </h3>
                    <p className="text-gray-600 text-sm">Serving all of Minnesota<br />Specializing in Twin Cities Metro Area</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-6" style={{ background: '#1B4332' }}>
                <h3 className="font-bold mb-2 text-white">Our Response Promise</h3>
                <p className="text-sm" style={{ color: '#B7E4C7' }}>
                  We respond to all inquiries within 24 hours during business days. For urgent placement needs, call us directly for immediate assistance.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #D1FAE5' }}>
              <h2 className="text-2xl font-black mb-6" style={{ color: '#1B4332' }}>Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={submitting} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={submitting} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} disabled={submitting} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <input type="text" id="organization" name="organization" value={formData.organization} onChange={handleChange} disabled={submitting} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
                  <select id="role" name="role" value={formData.role} onChange={handleChange} disabled={submitting} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:outline-none disabled:opacity-50">
                    <option value="">Select your role</option>
                    <option value="provider">Care Provider</option>
                    <option value="case_manager">Case Manager</option>
                    <option value="social_worker">Social Worker</option>
                    <option value="discharge_planner">Discharge Planner</option>
                    <option value="family">Family Member</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={4} disabled={submitting} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:outline-none disabled:opacity-50" placeholder="How can we help you?" />
                </div>
                <button type="submit" disabled={submitting} className="w-full py-3 px-6 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: '#1B4332' }}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

          {/* Bottom cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { title: 'Provider Inquiries', desc: 'Ready to grow your census? Contact us to learn about our referral services.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /> },
              { title: 'Referral Partners', desc: 'Case managers and social workers - let us help you find the right placement.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
              { title: 'General Support', desc: 'Questions about our platform or services? We are here to help.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            ].map(card => (
              <div key={card.title} className="bg-white rounded-2xl p-6 text-center shadow-sm" style={{ border: '1px solid #D1FAE5' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#E8F5E9' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1B4332' }}>{card.icon}</svg>
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#1B4332' }}>{card.title}</h3>
                <p className="text-sm text-gray-500">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}