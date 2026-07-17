// lib/types/careconnect.ts

// Service Types for 245D - Updated to match your usage
export type ServiceType =
  | 'ICS' | 'IHS' | 'RESPITE' | 'ADULT_DAY' | 'HOMEMAKER' | 'NIGHT_SUP'
  | 'FRS' | 'CRS' | 'DTH' | 'EMPLOY_SUP'
  | 'ASSISTED_LIVING' | 'HOME_HEALTH';

export const SERVICE_CATEGORY: Record<ServiceType, 'basic_245d' | 'intensive_245d' | 'non_245d'> = {
  ICS: 'basic_245d',
  IHS: 'basic_245d',
  RESPITE: 'basic_245d',
  ADULT_DAY: 'basic_245d',
  HOMEMAKER: 'basic_245d',
  NIGHT_SUP: 'basic_245d',
  FRS: 'intensive_245d',
  CRS: 'intensive_245d',
  DTH: 'intensive_245d',
  EMPLOY_SUP: 'intensive_245d',
  ASSISTED_LIVING: 'non_245d',
  HOME_HEALTH: 'non_245d',
};

// Waiver Types (NO private pay)
export type WaiverType = 'CADI' | 'DD' | 'BI' | 'Elderly';
// Provider Status
export type ProviderStatus = 'pending' | 'active' | 'inactive' | 'suspended';

// Referral Status
export type ReferralStatus = 
  | 'new'
  | 'reviewing'
  | 'contacting_provider'
  | 'provider_accepted'
  | 'provider_declined'
  | 'client_connected'
  | 'placement_confirmed'
  | 'placement_failed'
  | 'cancelled';

// Urgency Levels
export type UrgencyLevel = 'immediate' | 'within_week' | 'within_month' | 'flexible';

// Provider Interface
export interface Provider {
  id: string;
  business_name: string;
  license_number: string;
  
  // Contact (internal only)
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  
  // Services & Waivers
  service_types: ServiceType[];
  accepted_waivers: WaiverType[];
  
  // Capacity
  total_capacity: number;
  current_capacity: number;
  is_at_capacity: boolean;
  is_ghosted: boolean;
  
  // Details
  description?: string;
  amenities?: string[];
  languages_spoken?: string[];
  years_in_business?: number;
  
  // Photos
  primary_photo_url?: string;
  photo_urls?: string[];
  
  // Agreement
  referral_agreement_signed: boolean;
  referral_agreement_date?: string;
  commission_percentage?: number;
  
  // Verification
  verified_245d: boolean;
  verification_date?: string;
  
  // Status
  status: ProviderStatus;
  user_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Referral Request Interface
export interface ReferralRequest {
  id: string;
  
  // Client Info
  client_name: string;
  client_phone?: string;
  client_email?: string;
  
  // Service Needs
  service_types_needed?: ServiceType[];
  waiver_type: WaiverType;
  
  // Location
  preferred_city?: string;
  preferred_zip?: string;
  max_distance_miles?: number;
  
  // Additional Info
  move_in_date?: string;
  urgency?: UrgencyLevel;
  special_requirements?: string;
  budget_notes?: string;
  
  // Provider
  provider_id?: string;
  alternate_provider_ids?: string[];
  
  // Status
  status: ReferralStatus;
  
  // Notes
  internal_notes?: string;
  provider_response?: string;
  outcome_notes?: string;
  
  // Commission
  commission_earned?: number;
  commission_paid: boolean;
  commission_paid_date?: string;
  
  // Timestamps
  provider_contacted_at?: string;
  provider_responded_at?: string;
  client_connected_at?: string;
  placement_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

// Service Type Labels (for display) - UPDATED LABELS ONLY
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ICS: 'Integrated Community Supports',
  IHS: 'Individualized Home Supports',
  RESPITE: 'Respite Care',
  ADULT_DAY: 'Adult Day Services',
  HOMEMAKER: 'Homemaker Services',
  NIGHT_SUP: 'Night Supervision',
  FRS: 'Family Residential Services',
  CRS: 'Community Residential Services',
  DTH: 'Day Training & Habilitation',
  EMPLOY_SUP: 'Employment Support Services',
  ASSISTED_LIVING: 'Assisted Living',
  HOME_HEALTH: 'Home Health Care',
};

// Waiver Type Labels (for display) - KEEPING ALL WAIVERS
export const WAIVER_TYPE_LABELS: Record<WaiverType, string> = {
  CADI: 'Community Access for Disability Inclusion (CADI)',
  DD: 'Developmental Disabilities (DD)',
  BI: 'Brain Injury (BI)',
  Elderly: 'Elderly (65+)',
};

// Waiver Type Short Labels - KEEPING ALL WAIVERS
export const WAIVER_TYPE_SHORT: Record<WaiverType, string> = {
  CADI: 'CADI Waiver',
  DD: 'DD Waiver',
  BI: 'Brain Injury',
  Elderly: 'Elderly',
};

// Search Filters Interface
export interface SearchFilters {
  service_types?: ServiceType[];
  waiver_types?: WaiverType[];
  city?: string;
  zip_code?: string;
  max_distance?: number;
  show_full_only?: boolean;
}

// Admin User Interface
export interface AdminUser {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'staff';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// Export Provider so it can be imported directly
export default Provider;