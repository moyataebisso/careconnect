// utils/api.ts
import { createClient } from '@/lib/supabase/client'
import type { Provider, Service, Booking, BookingResponse } from '../types/booking';

interface CreateBookingData {
  provider_id: string;
  service_id: string;
  date: string;
  time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
}

export const api = {
  // Providers
  async getProviders(): Promise<Provider[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('status', 'active')
      .order('business_name')
    
    if (error) throw new Error('Failed to fetch providers')
    
    // Map to match Provider type with all optional fields
    return (data || []).map(p => ({
      id: p.id,
      business_name: p.business_name,
      contact_email: p.contact_email || p.business_email,
      contact_phone: p.contact_phone,
      address: p.address,
      city: p.city,
      state: p.state || 'MN',
      zip_code: p.zip_code,
      service_types: p.service_types || []
    }))
  },

  async getProvider(id: string): Promise<Provider> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error('Failed to fetch provider')
    
    return {
      id: data.id,
      business_name: data.business_name,
      contact_email: data.contact_email || data.business_email,
      contact_phone: data.contact_phone,
      address: data.address,
      city: data.city,
      state: data.state || 'MN',
      zip_code: data.zip_code,
      service_types: data.service_types || []
    }
  },

  // Services
  async getServices(providerId?: string): Promise<Service[]> {
    const supabase = createClient()
    
    if (providerId) {
      // Always return only "Initial Consultation" service
      return [{
        id: `consultation-${providerId}`,
        name: 'Initial Consultation',
        price: 0,
        duration: 60,
        provider_id: providerId,
        description: 'Initial consultation to discuss care needs and services'
      }]
    } else {
      // Get all providers and return consultation for each
      const { data: providers } = await supabase
        .from('providers')
        .select('id')
        .eq('status', 'active')
      
      return (providers || []).map(p => ({
        id: `consultation-${p.id}`,
        name: 'Initial Consultation',
        price: 0,
        duration: 60,
        provider_id: p.id,
        description: 'Initial consultation to discuss care needs and services'
      }))
    }
  },

  async getService(id: string): Promise<Service> {
    const supabase = createClient()
    
    // Handle temporary IDs
    if (id.startsWith('temp-')) {
      const parts = id.split('-')
      const providerId = parts[1]
      const index = parseInt(parts[2])
      
      const { data: provider } = await supabase
        .from('providers')
        .select('service_types')
        .eq('id', providerId)
        .single()
      
      if (provider && provider.service_types[index]) {
        return {
          id: id,
          name: provider.service_types[index],
          price: 0,
          duration: 60,
          provider_id: providerId,
          description: 'Standard service offering'
        }
      }
    }
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error('Failed to fetch service')
    
    return {
      id: data.id,
      name: data.name,
      price: data.price || 0,
      duration: data.duration || 60,
      provider_id: data.provider_id,
      description: data.description
    }
  },

  // Bookings
  async createBooking(bookingData: CreateBookingData): Promise<BookingResponse> {
    const supabase = createClient()
    
    // Don't store service_id at all since we only have "Initial Consultation"
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        provider_id: bookingData.provider_id,
        service_id: null,  // Always null since we only have one service type
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone,
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes || '',
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to create booking')
    }
    
    // Map to Booking type
    const booking: Booking = {
      id: data.id,
      provider_id: data.provider_id,
      service_id: data.service_id,
      date: data.date,
      time: data.time,
      status: data.status,
      notes: data.notes,
      created_at: data.created_at,
      customer_email: data.customer_email,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone
    }
    
    return {
      success: true,
      booking: booking,
      message: 'Booking created successfully'
    }
  },

  async getBookings(params: Record<string, string> = {}): Promise<Booking[]> {
    const supabase = createClient()
    let query = supabase
      .from('bookings')
      .select(`
        *,
        provider:providers(business_name, contact_email),
        service:services(name, price, duration)
      `)
    
    // Apply filters
    if (params.provider_id) {
      query = query.eq('provider_id', params.provider_id)
    }
    if (params.customer_email) {
      query = query.eq('customer_email', params.customer_email)
    }
    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.date) {
      query = query.eq('date', params.date)
    }
    
    const { data, error } = await query.order('date', { ascending: false })
    
    if (error) throw new Error('Failed to fetch bookings')
    
    // Map to Booking type
    return (data || []).map(b => ({
      id: b.id,
      provider_id: b.provider_id,
      customer_id: b.customer_id || undefined,
      service_id: b.service_id || undefined,
      date: b.date,
      time: b.time,
      status: b.status,
      notes: b.notes,
      created_at: b.created_at,
      customer_email: b.customer_email,
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      provider: b.provider,
      service: b.service,
      provider_name: b.provider?.business_name,
      service_name: b.service?.name
    }))
  },

  async cancelBooking(id: string, reason: string): Promise<{ success: boolean; booking: Booking }> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        notes: reason ? `Cancellation reason: ${reason}` : 'Cancelled by user'
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error('Failed to cancel booking')
    
    const booking: Booking = {
      id: data.id,
      provider_id: data.provider_id,
      service_id: data.service_id,
      date: data.date,
      time: data.time,
      status: data.status,
      notes: data.notes,
      created_at: data.created_at,
      customer_email: data.customer_email,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone
    }
    
    return {
      success: true,
      booking: booking
    }
  },
};