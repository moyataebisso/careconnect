'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../utils/api';
import type { Provider, Service, BookingData, BookingResponse } from '../../types/booking';

export default function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [bookingData, setBookingData] = useState<BookingData>({
    date: '',
    time: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadProviders();
    
    // Check if provider is pre-selected from URL
    const providerId = searchParams.get('provider');
    if (providerId) {
      setSelectedProvider(providerId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedProvider) {
      loadServices(selectedProvider);
    } else {
      setServices([]);
    }
  }, [selectedProvider]);

  const loadProviders = async (): Promise<void> => {
    try {
      const data = await api.getProviders();
      setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
      setMessage('Error loading providers');
    }
  };

  const loadServices = async (providerId: string): Promise<void> => {
    try {
      const data = await api.getServices(providerId);
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleInputChange = (field: keyof BookingData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setBookingData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response: BookingResponse = await api.createBooking({
        provider_id: selectedProvider,
        service_id: selectedService,
        ...bookingData
      });
      
      setMessage('✅ Booking created successfully! Redirecting...');
      console.log('Booking created:', response);
      
      // Wait a moment to show success message
      setTimeout(() => {
        // The response has structure: { success: boolean, booking: Booking, message: string }
        if (response.success && response.booking && response.booking.id) {
          router.push(`/booking-confirmation/${response.booking.id}`);
        } else {
          // Fallback to my-bookings if no ID returned
          console.log('No booking ID found, redirecting to my-bookings');
          router.push('/my-bookings');
        }
      }, 1500);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setMessage('❌ ' + errorMessage);
      setLoading(false);
    }
  };

  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get provider name for display
  const getProviderName = (): string => {
    const provider = providers.find(p => p.id === selectedProvider);
    return provider ? provider.business_name : '';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Book a Service</h2>
      
      {/* Show pre-selected provider info */}
      {selectedProvider && getProviderName() && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Booking with:</strong> {getProviderName()}
          </p>
        </div>
      )}
      
      {message && (
        <div className={`p-4 mb-4 rounded flex items-center ${
          message.includes('❌') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message.includes('✅') && (
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Provider <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          >
            <option value="">Choose a provider...</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.business_name}
              </option>
            ))}
          </select>
        </div>

        {selectedProvider && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Service <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            >
              <option value="">Choose a service...</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration} min)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={bookingData.date}
              onChange={handleInputChange('date')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={getTomorrowDate()}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Time <span className="text-red-500">*</span>
            </label>
            <select
              value={bookingData.time}
              onChange={handleInputChange('time')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            >
              <option value="">Select time...</option>
              {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={bookingData.customer_name}
            onChange={handleInputChange('customer_name')}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={bookingData.customer_email}
            onChange={handleInputChange('customer_email')}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={bookingData.customer_phone}
            onChange={handleInputChange('customer_phone')}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="555-0123"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
          <textarea
            value={bookingData.notes}
            onChange={handleInputChange('notes')}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Any special requirements or notes..."
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Booking...
              </span>
            ) : 'Book Now'}
          </button>
          
          {!loading && (
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}