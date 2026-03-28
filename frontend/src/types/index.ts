// API Response Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'student';
}

export interface Lab {
  id: number;
  name: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface PC {
  id: number;
  lab: number;
  name?: string;
  pc_code: string;
  device_name?: string;
  product_id?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  status: 'working' | 'not_working' | 'under_repair';
  connected: boolean;
  gpu: boolean;
  peripherals: boolean;
  device_name: string;
  status: string;
  brand?: string;
  serial_number?: string;
  created_at: string;
  updated_at: string;
  cpu?: CPU;
  peripheral_devices?: Peripheral[];
}

// Lab Equipment Types
export interface LabEquipment {
  id: number;
  lab: number;
  equipment_code: string;
  name: string;
  category: 'INFRASTRUCTURE' | 'APPLIANCE';
  equipment_type: 'SERVER' | 'ROUTER' | 'SWITCH' | 'HUB' | 'PROJECTOR' | 'E_BOARD' | 'AC' | 'FAN' | 'LIGHT' | 'UPS' | 'OTHER';
  brand?: string;
  model_name?: string;
  quantity: number;
  status: 'working' | 'not_working' | 'under_repair';
  is_networked: boolean;
  installation_date?: string;
  location_in_lab?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  network_details?: NetworkEquipmentDetails;
  server_details?: ServerDetails;
  projector_details?: ProjectorDetails;
  electrical_details?: ElectricalApplianceDetails;
}

export interface NetworkEquipmentDetails {
  id: number;
  equipment: number;
  ip_address?: string;
  mac_address?: string;
  firmware_version?: string;
  number_of_ports?: number;
  rack_unit_size?: number;
  managed_switch: boolean;
  bandwidth_capacity?: string;
  power_rating?: string;
  created_at: string;
  updated_at: string;
}

export interface ServerDetails {
  id: number;
  equipment: number;
  cpu_model?: string;
  total_ram?: string;
  total_storage?: string;
  raid_config?: string;
  virtualization_enabled: boolean;
  operating_system?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectorDetails {
  id: number;
  equipment: number;
  resolution?: string;
  brightness_lumens?: number;
  throw_type?: string;
  hdmi_ports?: number;
  created_at: string;
  updated_at: string;
}

export interface ElectricalApplianceDetails {
  id: number;
  equipment: number;
  power_rating?: string;
  voltage?: string;
  inverter_type: boolean;
  energy_rating?: string;
  service_due_date?: string;
  created_at: string;
  updated_at: string;
}

// CPU and OS for PCs
export interface CPU {
  id: number;
  pc: number;
  model: string;
  clock_speed?: string;
  core_count?: number;
  integrated_graphics: boolean;
  created_at: string;
  updated_at: string;
}

export interface OS {
  id: number;
  pc: number;
  name: string;
  version?: string;
  install_date?: string;
  expiration_date?: string;
  architecture: '32-bit' | '64-bit';
  product_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Peripheral {
  id: number;
  pc: number;
  peripheral_type: 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'webcam' | 'printer' | 'speaker' | 'other';
  brand?: string;
  model_name?: string;
  serial_number?: string;
  status: 'working' | 'not_working';
  created_at: string;
  updated_at: string;
}

export interface Software {
  id: number;
  pc: number;
  name: string;
  version?: string;
  license_key?: string;
  expiry_date?: string;
}

export interface MaintenanceLog {
  id: number;
  pc?: number;
  lab_equipment?: number;
  peripheral?: number;
  lab?: number;
  reported_by?: number;
  fixed_by?: number;
  issue_description?: string;
  status_before?: string;
  status_after?: string;
  status: 'pending' | 'fixed';
  reported_on: string;
  fixed_on?: string;
  remarks?: string;
}

export interface Inventory {
  id: string;
  equipment_type: string;
  total_quantity: number;
  working_quantity: number;
  not_working_quantity: number;
  under_repair_quantity: number;
  lab: number;
}
export interface LoginRequest {
  username: string;
  password: string;
}
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'student';
}
export interface AuthResponse {
  access: string;
  refresh: string;
  role?: 'admin' | 'student';
  username?: string;
}
export interface Ticket {
  id: number;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'closed' | string;
  created_at: string;
}

// Import related types
export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
  lab?: string;
}

export interface BulkImportRequest {
  file: File;
  lab_id?: number;
}

// Notification types
export interface MaintenanceNotification {
  id: number;
  lab: string;
  issue_description: string;
  created_at: string;
  technician_email: string;
}

export interface RedirectAfterLoginResponse {
  redirect_to: string;
}

// Muster Register Types
export interface MusterSession {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  lab: number;
  lab_name: string;
  class_name: string;
  batch: string;
  created_at: string;
  entries: MusterEntry[];
}

export interface MusterEntry {
  id: number;
  sr_no: number;
  roll_no: string;
  pc: number;
  pc_name: string;
}