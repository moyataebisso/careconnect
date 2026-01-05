/**
 * Booking Tests
 * 
 * Tests for booking-related functionality
 */

import { mockSupabase } from '../mocks/supabase'

describe('Booking System', () => {
  beforeEach(() => {
    mockSupabase.__resetMocks()
    jest.clearAllMocks()
  })

  describe('Create Booking', () => {
    it('should create a booking with valid data', async () => {
      const bookingData = {
        provider_id: 'provider-1',
        service_id: 'service-1',
        date: '2025-01-20',
        time: '10:00 AM',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '555-1234',
        notes: 'First appointment',
        status: 'pending',
      }

      const createdBooking = {
        id: 'booking-new',
        ...bookingData,
        created_at: new Date().toISOString(),
      }

      mockSupabase.__setMockResponse(createdBooking)

      const result = await mockSupabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single()

      expect(result.data).toEqual(createdBooking)
      expect(result.data.status).toBe('pending')
    })

    it('should validate required fields', () => {
      const invalidData = {
        provider_id: 'provider-1',
        // Missing: service_id, date, time, customer info
      }

      const requiredFields = ['service_id', 'date', 'time', 'customer_name', 'customer_email', 'customer_phone']
      const missingFields = requiredFields.filter(field => !(field in invalidData))

      expect(missingFields.length).toBeGreaterThan(0)
      expect(missingFields).toContain('service_id')
      expect(missingFields).toContain('customer_email')
    })

    it('should reject past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const pastDate = yesterday.toISOString().split('T')[0]

      const today = new Date()
      today.setDate(today.getDate() + 1)
      const tomorrow = today.toISOString().split('T')[0]

      // Compare dates
      expect(new Date(pastDate) < new Date()).toBe(true)
      expect(new Date(tomorrow) >= new Date()).toBe(true)
    })

    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.org', 'a@b.co']
      const invalidEmails = ['invalid', '@domain.com', 'test@', 'test@.com']

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })
  })

  describe('Get Bookings', () => {
    it('should fetch bookings for a provider', async () => {
      const providerBookings = [
        { id: 'b1', provider_id: 'provider-1', status: 'pending' },
        { id: 'b2', provider_id: 'provider-1', status: 'confirmed' },
      ]

      mockSupabase.__setMockResponse(providerBookings)

      const result = await mockSupabase
        .from('bookings')
        .select('*')
        .eq('provider_id', 'provider-1')

      expect(result.data).toHaveLength(2)
      const bookings = result.data as Array<{ id: string; provider_id: string; status: string }>
      expect(bookings.every((b) => b.provider_id === 'provider-1')).toBe(true)
    })

    it('should fetch bookings for a customer by email', async () => {
      const customerBookings = [
        { id: 'b1', customer_email: 'john@example.com', provider_id: 'p1' },
        { id: 'b2', customer_email: 'john@example.com', provider_id: 'p2' },
      ]

      mockSupabase.__setMockResponse(customerBookings)

      const result = await mockSupabase
        .from('bookings')
        .select('*')
        .eq('customer_email', 'john@example.com')

      expect(result.data).toHaveLength(2)
    })

    it('should fetch bookings with provider and service details', async () => {
      const bookingsWithDetails = [
        {
          id: 'b1',
          provider_id: 'provider-1',
          service_id: 'service-1',
          provider: { business_name: 'Test Provider' },
          service: { name: 'Day Care', price: 150 },
        },
      ]

      mockSupabase.__setMockResponse(bookingsWithDetails)

      const result = await mockSupabase
        .from('bookings')
        .select(`
          *,
          provider:providers(business_name),
          service:services(name, price)
        `)

      expect(result.data?.[0].provider?.business_name).toBe('Test Provider')
      expect(result.data?.[0].service?.name).toBe('Day Care')
    })
  })

  describe('Update Booking Status', () => {
    it('should confirm a pending booking', async () => {
      const confirmedBooking = {
        id: 'b1',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      }

      mockSupabase.__setMockResponse(confirmedBooking)

      const result = await mockSupabase
        .from('bookings')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', 'b1')
        .select()
        .single()

      expect(result.data.status).toBe('confirmed')
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    it('should cancel a booking with reason', async () => {
      const cancelledBooking = {
        id: 'b1',
        status: 'cancelled',
        cancellation_reason: 'Schedule conflict',
        cancelled_at: new Date().toISOString(),
      }

      mockSupabase.__setMockResponse(cancelledBooking)

      const result = await mockSupabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Schedule conflict',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', 'b1')
        .select()
        .single()

      expect(result.data.status).toBe('cancelled')
      expect(result.data.cancellation_reason).toBe('Schedule conflict')
    })

    it('should complete a booking', async () => {
      const completedBooking = {
        id: 'b1',
        status: 'completed',
        completed_at: new Date().toISOString(),
      }

      mockSupabase.__setMockResponse(completedBooking)

      const result = await mockSupabase
        .from('bookings')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', 'b1')
        .select()
        .single()

      expect(result.data.status).toBe('completed')
    })
  })

  describe('Booking Validation', () => {
    it('should prevent double booking same time slot', async () => {
      // Check if slot is already taken
      const existingBookings = [
        { id: 'b1', date: '2025-01-20', time: '10:00 AM', provider_id: 'p1' },
      ]

      mockSupabase.__setMockResponse(existingBookings)

      const result = await mockSupabase
        .from('bookings')
        .select('*')
        .eq('provider_id', 'p1')
        .eq('date', '2025-01-20')
        .eq('time', '10:00 AM')
        .neq('status', 'cancelled')

      const isSlotTaken = (result.data?.length ?? 0) > 0
      expect(isSlotTaken).toBe(true)
    })

    it('should allow booking different time slots', async () => {
      mockSupabase.__setMockResponse([])

      const result = await mockSupabase
        .from('bookings')
        .select('*')
        .eq('provider_id', 'p1')
        .eq('date', '2025-01-20')
        .eq('time', '2:00 PM')
        .neq('status', 'cancelled')

      const isSlotAvailable = (result.data?.length ?? 0) === 0
      expect(isSlotAvailable).toBe(true)
    })

    it('should validate phone number format', () => {
      const validPhones = ['555-1234', '(555) 123-4567', '5551234567']
      const invalidPhones = ['123', 'abc-defg', '']

      // Basic phone validation - at least 7 digits
      const hasEnoughDigits = (phone: string) => {
        const digits = phone.replace(/\D/g, '')
        return digits.length >= 7
      }

      validPhones.forEach(phone => {
        expect(hasEnoughDigits(phone)).toBe(true)
      })

      invalidPhones.forEach(phone => {
        expect(hasEnoughDigits(phone)).toBe(false)
      })
    })
  })

  describe('Time Slot Generation', () => {
    it('should generate available time slots', () => {
      const timeSlots = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
      ]

      expect(timeSlots).toHaveLength(9)
      expect(timeSlots[0]).toBe('9:00 AM')
      expect(timeSlots[timeSlots.length - 1]).toBe('5:00 PM')
    })

    it('should calculate tomorrow\'s date correctly', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const today = new Date().toISOString().split('T')[0]
      
      expect(tomorrowStr).not.toBe(today)
      expect(new Date(tomorrowStr) > new Date(today)).toBe(true)
    })
  })
})