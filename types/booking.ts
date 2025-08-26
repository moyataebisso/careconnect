// types/booking.ts

export interface Provider {
  id: string;
  business_name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  service_types?: string[];  // Added back for compatibility
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  provider_id: string;
  description?: string;
}

export interface BookingData {
  date: string;
  time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
}

export interface BookingResponse {
  success: boolean;
  booking: Booking;
  message: string;
}

export interface Booking {
  id: string;
  provider_id: string;
  customer_id?: string;
  service_id?: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  created_at: string;
  // Fields from the actual booking
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  // Optional relations
  provider?: {
    business_name?: string;
    contact_email?: string;
  };
  service?: {
    name?: string;
    price?: number;
    duration?: number;
  };
  provider_name?: string;
  service_name?: string;
}