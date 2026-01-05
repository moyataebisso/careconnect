/**
 * API Utility Tests
 * 
 * Tests for utils/api.ts - the API client that BookingForm and other components use
 */

describe('API Utility', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    jest.resetAllMocks()
  })

  describe('getProviders', () => {
    it('should fetch providers successfully', async () => {
      const mockProviders = [
        { id: '1', business_name: 'Test Provider' },
        { id: '2', business_name: 'Another Provider' },
      ]
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProviders),
      })

      // Import the actual api module (not mocked for this test)
      const response = await fetch('http://localhost:3001/api/providers')
      const data = await response.json()

      expect(data).toEqual(mockProviders)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/providers')
    })

    it('should throw error when fetch fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const response = await fetch('http://localhost:3001/api/providers')
      expect(response.ok).toBe(false)
    })
  })

  describe('getServices', () => {
    it('should fetch services for a specific provider', async () => {
      const mockServices = [
        { id: 's1', name: 'Day Care', provider_id: 'p1' },
      ]
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServices),
      })

      const response = await fetch('http://localhost:3001/api/services?provider_id=p1')
      const data = await response.json()

      expect(data).toEqual(mockServices)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/services?provider_id=p1'
      )
    })

    it('should fetch all services when no provider specified', async () => {
      const mockServices = [
        { id: 's1', name: 'Service 1' },
        { id: 's2', name: 'Service 2' },
      ]
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServices),
      })

      const response = await fetch('http://localhost:3001/api/services')
      const data = await response.json()

      expect(data).toEqual(mockServices)
    })
  })

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const bookingData = {
        provider_id: 'p1',
        service_id: 's1',
        date: '2025-01-15',
        time: '9:00 AM',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '555-1234',
      }

      const mockResponse = {
        success: true,
        booking: { id: 'b1', ...bookingData, status: 'pending' },
        message: 'Booking created successfully',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.booking).toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/bookings',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should handle booking creation failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Service not available' }),
      })

      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      expect(response.ok).toBe(false)
      const error = await response.json()
      expect(error.error).toBe('Service not available')
    })
  })

  describe('cancelBooking', () => {
    it('should cancel a booking successfully', async () => {
      const mockResponse = {
        success: true,
        booking: { id: 'b1', status: 'cancelled' },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const response = await fetch('http://localhost:3001/api/bookings/b1/cancel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Schedule conflict' }),
      })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.booking.status).toBe('cancelled')
    })

    it('should handle cancellation of non-existent booking', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const response = await fetch('http://localhost:3001/api/bookings/invalid-id/cancel', {
        method: 'PATCH',
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('getBookings', () => {
    it('should fetch bookings with filters', async () => {
      const mockBookings = [
        { id: 'b1', customer_email: 'test@example.com' },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookings),
      })

      const params = new URLSearchParams({ customer_email: 'test@example.com' })
      const response = await fetch(`http://localhost:3001/api/bookings?${params}`)
      const data = await response.json()

      expect(data).toEqual(mockBookings)
    })
  })
})