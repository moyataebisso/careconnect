/**
 * API Mock Utility
 * 
 * Mock the utils/api module for testing components that use it.
 */

import type { Provider, Service, Booking, BookingResponse } from '@/types/booking'

// Type for booking creation data
interface CreateBookingData {
  provider_id: string
  service_id: string
  date: string
  time: string
  customer_name: string
  customer_email: string
  customer_phone: string
  notes?: string
}

// Sample test data
export const mockProviders: Provider[] = [
  {
    id: 'provider-1',
    business_name: 'Test Care Home',
    contact_email: 'test@carehome.com',
    contact_phone: '555-0100',
    address: '123 Care St',
    city: 'Minneapolis',
    state: 'MN',
    zip_code: '55401',
    service_types: ['Adult Day Care', 'Respite Care'],
  },
  {
    id: 'provider-2',
    business_name: 'Sunshine Assisted Living',
    contact_email: 'info@sunshine.com',
    contact_phone: '555-0200',
    address: '456 Sunny Ave',
    city: 'St Paul',
    state: 'MN',
    zip_code: '55102',
    service_types: ['Memory Care', 'Assisted Living'],
  },
]

export const mockServices: Service[] = [
  {
    id: 'service-1',
    name: 'Day Care Session',
    price: 150,
    duration: 480,
    provider_id: 'provider-1',
    description: 'Full day care service',
  },
  {
    id: 'service-2',
    name: 'Respite Care',
    price: 200,
    duration: 240,
    provider_id: 'provider-1',
    description: 'Short-term respite care',
  },
  {
    id: 'service-3',
    name: 'Memory Care Consultation',
    price: 100,
    duration: 60,
    provider_id: 'provider-2',
    description: 'Initial consultation for memory care',
  },
]

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    provider_id: 'provider-1',
    customer_id: 'customer-1',
    service_id: 'service-1',
    date: '2025-01-15',
    time: '9:00 AM',
    status: 'pending',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '555-1234',
    notes: 'First visit',
    created_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 'booking-2',
    provider_id: 'provider-1',
    customer_id: 'customer-2',
    service_id: 'service-2',
    date: '2025-01-16',
    time: '2:00 PM',
    status: 'confirmed',
    customer_name: 'Jane Smith',
    customer_email: 'jane@example.com',
    customer_phone: '555-5678',
    created_at: '2025-01-11T14:00:00Z',
  },
]

// Create mock API functions
export const mockApi = {
  getProviders: jest.fn<Promise<Provider[]>, []>(() => Promise.resolve(mockProviders)),
  
  getProvider: jest.fn<Promise<Provider>, [string]>((id) => {
    const provider = mockProviders.find(p => p.id === id)
    if (!provider) return Promise.reject(new Error('Provider not found'))
    return Promise.resolve(provider)
  }),
  
  getServices: jest.fn<Promise<Service[]>, [string?]>((providerId) => {
    if (providerId) {
      return Promise.resolve(mockServices.filter(s => s.provider_id === providerId))
    }
    return Promise.resolve(mockServices)
  }),
  
  getService: jest.fn<Promise<Service>, [string]>((id) => {
    const service = mockServices.find(s => s.id === id)
    if (!service) return Promise.reject(new Error('Service not found'))
    return Promise.resolve(service)
  }),
  
  createBooking: jest.fn<Promise<BookingResponse>, [CreateBookingData]>((data) => {
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      provider_id: data.provider_id,
      service_id: data.service_id,
      date: data.date,
      time: data.time,
      status: 'pending',
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      notes: data.notes,
      created_at: new Date().toISOString(),
    }
    return Promise.resolve({
      success: true,
      booking: newBooking,
      message: 'Booking created successfully',
    })
  }),
  
  getBookings: jest.fn<Promise<Booking[]>, [Record<string, string>?]>((params) => {
    let filtered = [...mockBookings]
    if (params?.provider_id) {
      filtered = filtered.filter(b => b.provider_id === params.provider_id)
    }
    if (params?.customer_email) {
      filtered = filtered.filter(b => b.customer_email === params.customer_email)
    }
    return Promise.resolve(filtered)
  }),
  
  cancelBooking: jest.fn<Promise<{ success: boolean; booking: Booking }>, [string, string]>((id, reason) => {
    const booking = mockBookings.find(b => b.id === id)
    if (!booking) return Promise.reject(new Error('Booking not found'))
    return Promise.resolve({
      success: true,
      booking: { ...booking, status: 'cancelled' },
    })
  }),
}

// Reset all mocks
export const resetApiMocks = () => {
  Object.values(mockApi).forEach(fn => fn.mockClear())
}

// Apply mock to the api module
jest.mock('@/utils/api', () => ({
  api: mockApi,
}))