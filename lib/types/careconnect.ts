// lib/types/careconnect.ts

// Service Types for 245D - Updated structure
export type ServiceType = 
  // Basic Services
  | 'ICS'           // Integrated Community Services
  | 'FRS'           // Family Residential Services  
  | 'CRS'           // Community Residential Services
  | 'DC_DM'         // Day Care/Day Services
  // Comprehensive Services
  | 'ADL_SUPPORT'   // ADLs Support
  | 'ASSISTED_LIVING'; // Assisted Living

// Waiver Types (NO private pay)
export type WaiverType = 'CADI' | 'DD' | 'BI' | 'ELDERLY';

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

// Service Type Labels (for display) - Updated
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  // Basic Services
  ICS: 'Integrated Community Services',
  FRS: 'Family Residential Services',
  CRS: 'Community Residential Services',
  DC_DM: 'Day Care/Day Services',
  // Comprehensive Services  
  ADL_SUPPORT: 'Activities of Daily Living Support',
  ASSISTED_LIVING: 'Assisted Living (24/7 Care with ADLs)'
};

// Waiver Type Labels (for display) - Updated
export const WAIVER_TYPE_LABELS: Record<WaiverType, string> = {
  CADI: 'Community Access for Disability Inclusion (18+)',
  DD: 'Developmental Disabilities (All Ages)',
  BI: 'Brain Injury (All Ages)',
  ELDERLY: 'Elderly Waiver (65+)'
};

// Waiver Type Short Labels
export const WAIVER_TYPE_SHORT: Record<WaiverType, string> = {
  CADI: 'CADI Waiver',
  DD: 'DD Waiver',
  BI: 'BI Waiver',
  ELDERLY: 'Elderly Waiver'
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