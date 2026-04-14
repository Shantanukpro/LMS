// Authentication & User
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'student' | 'faculty' | 'lab_incharge';
  profile_picture: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'student' | 'faculty' | 'lab_incharge';
}

export interface AuthResponse {
  access: string;
  refresh: string;
  id?: number;
  role?: 'admin' | 'student' | 'faculty' | 'lab_incharge';
  username?: string;
}

// Lab Model
export interface Lab {
  id: number;
  name: string;
  location: string;
  manual_cost?: string | number;
  total_price?: number | string;
  created_at?: string;
  updated_at?: string;
}

// PC + Sub-models
export interface CPU {
  id: number;
  model: string;
  clock_speed: string;
  core_count: number;
  integrated_graphics: boolean;
  price?: number | string;
}

export interface OS {
  id: number;
  name: string;
  version: string;
  architecture: '32-bit' | '64-bit';
  product_key: string;
  install_date: string;
  expiration_date: string;
  license_cost?: number | string;
}

export interface Software {
  id: number;
  pc: number;
  name: string;
  version?: string;
  license_key?: string;
  expiry_date?: string;
}

export interface Peripheral {
  id: number;
  pc: number;
  type: string;
  status: 'working' | 'broken';
  price?: number | string;
  // legacy compat
  peripheral_type?: string; 
  brand?: string;
  model_name?: string;
  serial_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PC {
  id: number;
  device_name: string;
  status: string;
  connected: boolean;
  gpu: boolean;
  peripherals: boolean;
  brand: string;
  lab: number;
  base_price?: number | string;
  total_price?: number | string;
  cpu?: CPU;
  os?: OS;
  software?: Software[];
  peripherals_list?: Peripheral[];
  // Fallbacks for older type usages
  pc_code?: string;
  product_id?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  serial_number?: string;
  graphics_card?: string;
  created_at?: string;
  updated_at?: string;
  peripheral_devices?: Peripheral[];
}

// Lab Equipment
export type EquipmentType = 'ROUTER' | 'SWITCH' | 'HUB' | 'SERVER' | 'PROJECTOR' | 'E_BOARD' | 'AC' | 'FAN' | 'LIGHT' | 'UPS' | 'OTHER';

export interface NetworkEquipmentDetails {
  ip_address: string;
  mac_address: string;
  firmware_version: string;
  managed_switch: boolean;
  bandwidth_capacity: string;
}

export interface ServerDetails {
  total_ram: string;
  raid_config: string;
  virtualization_enabled: boolean;
}

export interface ProjectorDetails {
  resolution: string;
  brightness_lumens: number;
  throw_type: string;
}

export interface ElectricalApplianceDetails {
  power_rating: string;
  voltage: string;
  inverter_type: string;
  energy_rating: string;
}

export interface LabEquipment {
  id: number;
  lab: number;
  category: string;
  status: string;
  quantity: number;
  location_in_lab: string;
  equipment_type: EquipmentType;
  details: NetworkEquipmentDetails | ServerDetails | ProjectorDetails | ElectricalApplianceDetails;
  // Fallbacks for older type usages
  equipment_code?: string;
  name?: string;
  brand?: string;
  model_name?: string;
  is_networked?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Maintenance & Tickets
export interface MaintenanceLog {
  id: number;
  pc?: number | null;
  lab_equipment?: number | null;
  peripheral?: number | null;
  status_before: string;
  status_after: string;
  reported_by: User;
  fixed_by: User;
  created_at: string;
  updated_at: string;
  // Old fields used in UI
  issue_description?: string;
  remarks?: string;
  status?: 'pending' | 'fixed' | string;
  reported_on?: string;
  fixed_on?: string;
  lab?: number;
}

export interface Ticket {
  id: number;
  student: number;
  pc: number;
  issue_description: string;
  status: string;
  created_at?: string;
  // fallback
  title?: string;
  description?: string;
}

// Notifications
export type NotificationType = 'escalation' | 'info';

export interface Notification {
  id: number;
  user: number;
  maintenance_log?: number;
  ticket?: number;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MaintenanceNotification {
  id: number;
  lab: string;
  issue_description: string;
  created_at: string;
  technician_email: string;
}

// Muster / Attendance
export interface MusterSession {
  id: number;
  lab: number;
  class_name: string;
  chunk: string;
  date: string;
  // Fallbacks
  time?: string;
  batch?: string;
  created_at?: string;
  lab_name?: string;
  entries?: MusterEntry[];
}

export interface MusterEntry {
  id: number;
  session: number;
  student_roll_no: string;
  pc: number;
  // Fallbacks
  sr_no?: number;
  roll_no?: string;
  pc_name?: string;
}

export interface MusterSessionCreate {
  date: string;
  time: string;
  lab: number;
  class_name: string;
  batch: string;
}

// Import Types
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

export interface Inventory {
  id: string;
  equipment_type: string;
  total_quantity: number;
  working_quantity: number;
  not_working_quantity: number;
  under_repair_quantity: number;
  lab: number;
}