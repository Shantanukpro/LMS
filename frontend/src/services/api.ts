import axios from 'axios';
import type { 
  User, Lab, PC, LabEquipment, NetworkEquipmentDetails, ServerDetails,
  ProjectorDetails, ElectricalApplianceDetails, CPU, OS, Peripheral, Software, 
  MaintenanceLog, ImportResult, BulkImportRequest, MaintenanceNotification,
  LoginRequest, RegisterRequest, AuthResponse, MusterSession, MusterSessionCreate, MusterEntry,
  Ticket, Notification, Inventory,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';

// Helper to extract results from DRF paginated responses
const extractResults = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

// Navigation helpers
export const navigationAPI = {
  redirectAfterLogin: async (): Promise<{ redirect_to: string }> => {
    const response = await api.get('/redirect-after-login/');
    return response.data;
  },
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Request interceptor to add auth token and logging
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

// Response interceptor to handle token refresh and global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Global Error Logger & Formatting
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      console.error(`[API Error Response] Status: ${status}`, data);
      
      let errMsg = 'An unexpected error occurred';
      if (typeof data === 'string') errMsg = data;
      else if (data?.detail) errMsg = data.detail;
      else if (data?.error) errMsg = data.error;
      else if (data?.message) errMsg = data.message;
      else if (status === 400 && typeof data === 'object') {
        errMsg = Object.values(data).flat().join(', ');
      }
      
      error.formattedMessage = errMsg;

      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
              refresh: refreshToken,
            });
            const { access } = response.data;
            setTokens(access, refreshToken);
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
          } catch (refreshError) {
            clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    } else if (error.request) {
      console.error('[API Network Error] Server not reachable', error.request);
      error.formattedMessage = 'Server not reachable. Please check your connection or backend server.';
    } else {
      console.error('[API Setup Error]', error.message);
      error.formattedMessage = error.message;
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/token/', data);
    return response.data;
  },
  
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/users/register/', data);
    return response.data;
  },
  
  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await api.post('/token/refresh/', { refresh });
    return response.data;
  },
  
  socialLogin: async (data: { provider: string; email: string; role?: string }): Promise<AuthResponse & { is_new?: boolean }> => {
    const response = await api.post('/users/social-login/', data);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users/');
    return extractResults<User>(response.data);
  },
  
  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },
  
  updateProfile: async (id: number, data: FormData): Promise<User> => {
    // Requires FormData because of profile_picture upload
    const response = await api.patch(`/users/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  promote: async (id: number): Promise<User> => {
    const response = await api.patch(`/users/${id}/`, { role: 'admin' });
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}/`);
  },
};

// Labs API
export const labsAPI = {
  getAll: async (): Promise<Lab[]> => {
    const response = await api.get('/labs/');
    return extractResults<Lab>(response.data);
  },
  
  getById: async (id: number): Promise<Lab> => {
    const response = await api.get(`/labs/${id}/`);
    return response.data;
  },
  
  create: async (data: Omit<Lab, 'id' | 'created_at' | 'updated_at'>): Promise<Lab> => {
    const response = await api.post('/labs/', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Lab>): Promise<Lab> => {
    const response = await api.patch(`/labs/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/labs/${id}/`);
  },
};

// Tickets API
export const ticketsAPI = {
  create: async (payload: Omit<Ticket, 'id' | 'status' | 'created_at'>): Promise<Ticket> => {
    const response = await api.post('/tickets/create/', payload);
    return response.data;
  },
  getAll: async (): Promise<Ticket[]> => {
    const response = await api.get('/tickets/list/');
    return extractResults<Ticket>(response.data);
  },
  listMy: async (): Promise<Ticket[]> => {
    const response = await api.get('/tickets/list/');
    return extractResults<Ticket>(response.data);
  },
  update: async (id: number, data: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.patch(`/tickets/${id}/update/`, data);
    return response.data;
  },
};

// LabEquipment API
export const labEquipmentAPI = {
  getAll: async (): Promise<LabEquipment[]> => {
    const response = await api.get('/lab-equipment/');
    return extractResults<LabEquipment>(response.data);
  },

  getById: async (id: number): Promise<LabEquipment> => {
    const response = await api.get(`/lab-equipment/${id}/`);
    return response.data;
  },

  getByLab: async (labId: number): Promise<LabEquipment[]> => {
    const response = await api.get(`/labs/${labId}/equipment/`);
    return extractResults<LabEquipment>(response.data);
  },

  create: async (data: Partial<LabEquipment>): Promise<LabEquipment> => {
    const response = await api.post('/lab-equipment/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<LabEquipment>): Promise<LabEquipment> => {
    const response = await api.patch(`/lab-equipment/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/lab-equipment/${id}/`);
  },

  updateNetworkDetails: async (equipmentId: number, data: Partial<NetworkEquipmentDetails>): Promise<NetworkEquipmentDetails> => {
    const response = await api.patch(`/lab-equipment/${equipmentId}/network-details/`, data);
    return response.data;
  },

  updateServerDetails: async (equipmentId: number, data: Partial<ServerDetails>): Promise<ServerDetails> => {
    const response = await api.patch(`/lab-equipment/${equipmentId}/server-details/`, data);
    return response.data;
  },

  updateProjectorDetails: async (equipmentId: number, data: Partial<ProjectorDetails>): Promise<ProjectorDetails> => {
    const response = await api.patch(`/lab-equipment/${equipmentId}/projector-details/`, data);
    return response.data;
  },

  updateElectricalDetails: async (equipmentId: number, data: Partial<ElectricalApplianceDetails>): Promise<ElectricalApplianceDetails> => {
    const response = await api.patch(`/lab-equipment/${equipmentId}/electrical-details/`, data);
    return response.data;
  },
};

// PCs API
export const pcsAPI = {
  getAll: async (): Promise<PC[]> => {
    const response = await api.get('/pcs/');
    return extractResults<PC>(response.data);
  },

  getByLab: async (labId: number): Promise<PC[]> => {
    const response = await api.get(`/labs/${labId}/pcs/`);
    return extractResults<PC>(response.data);
  },
  
  getById: async (id: number): Promise<PC> => {
    const response = await api.get(`/pcs/${id}/`);
    return response.data;
  },
  
  create: async (labId: number, data: Partial<PC>): Promise<PC> => {
    const response = await api.post(`/labs/${labId}/pcs/`, { ...data, lab: labId });
    return response.data;
  },
  
  update: async (id: number, data: Partial<PC>): Promise<PC> => {
    const response = await api.patch(`/pcs/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pcs/${id}/`);
  },

  getCPU: async (pcId: number): Promise<CPU> => {
    const response = await api.get(`/pcs/${pcId}/cpu/`);
    return response.data;
  },

  updateCPU: async (pcId: number, data: Partial<CPU>): Promise<CPU> => {
    const response = await api.patch(`/pcs/${pcId}/cpu/`, data);
    return response.data;
  },

  getOS: async (pcId: number): Promise<OS> => {
    const response = await api.get(`/pcs/${pcId}/os/`);
    return response.data;
  },

  updateOS: async (pcId: number, data: Partial<OS>): Promise<OS> => {
    const response = await api.patch(`/pcs/${pcId}/os/`, data);
    return response.data;
  },

  getPeripherals: async (pcId: number): Promise<Peripheral[]> => {
    const response = await api.get(`/pcs/${pcId}/peripherals/`);
    return extractResults<Peripheral>(response.data);
  },

  addPeripheral: async (pcId: number, data: Omit<Peripheral, 'id' | 'pc' | 'created_at' | 'updated_at'>): Promise<Peripheral> => {
    const response = await api.post(`/pcs/${pcId}/peripherals/`, data);
    return response.data;
  },

  updatePeripheral: async (id: number, data: Partial<Peripheral>): Promise<Peripheral> => {
    const response = await api.patch(`/peripherals/${id}/`, data);
    return response.data;
  },

  deletePeripheral: async (id: number): Promise<void> => {
    await api.delete(`/peripherals/${id}/`);
  },
};

// Peripherals API
export const peripheralsAPI = {
  getAll: async (): Promise<Peripheral[]> => {
    const response = await api.get('/peripherals/');
    return extractResults<Peripheral>(response.data);
  },
  update: async (id: number, data: Partial<Peripheral>): Promise<Peripheral> => {
    const response = await api.patch(`/peripherals/${id}/`, data);
    return response.data;
  },
};

// Software API
export const softwareAPI = {
  getByPC: async (pcId: number): Promise<Software[]> => {
    const response = await api.get(`/pcs/${pcId}/software/`);
    return extractResults<Software>(response.data);
  },
  
  getAll: async (): Promise<Software[]> => {
    const response = await api.get('/software/');
    return extractResults<Software>(response.data);
  },
  
  getById: async (id: number): Promise<Software> => {
    const response = await api.get(`/software/${id}/`);
    return response.data;
  },
  
  create: async (pcId: number, data: Omit<Software, 'id' | 'pc'>): Promise<Software> => {
    const response = await api.post(`/pcs/${pcId}/software/`, data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Software>): Promise<Software> => {
    const response = await api.patch(`/software/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/software/${id}/`);
  },
};

// Maintenance API
export const maintenanceAPI = {
  getAll: async (): Promise<MaintenanceLog[]> => {
    const response = await api.get('/maintenance/');
    return extractResults<MaintenanceLog>(response.data);
  },

  getByLab: async (labId: number): Promise<MaintenanceLog[]> => {
    const response = await api.get(`/labs/${labId}/maintenance/`);
    return extractResults<MaintenanceLog>(response.data);
  },

  getByPC: async (pcId: number): Promise<MaintenanceLog[]> => {
    const response = await api.get(`/pcs/${pcId}/maintenance/`);
    return extractResults<MaintenanceLog>(response.data);
  },

  getByEquipment: async (equipmentId: number): Promise<MaintenanceLog[]> => {
    const response = await api.get(`/lab-equipment/${equipmentId}/maintenance/`);
    return extractResults<MaintenanceLog>(response.data);
  },
  
  getById: async (id: number): Promise<MaintenanceLog> => {
    const response = await api.get(`/maintenance/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<MaintenanceLog>): Promise<MaintenanceLog> => {
    const response = await api.post('/maintenance/', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<MaintenanceLog>): Promise<MaintenanceLog> => {
    const response = await api.patch(`/maintenance/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/maintenance/${id}/`);
  },
};

// Import API
export const importAPI = {
  importLabs: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity', 'labs');
    const response = await api.post('/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  importPCs: async (file: File, labId?: number): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity', 'pcs');
    if (labId) {
      formData.append('lab_id', labId.toString());
    }
    const response = await api.post('/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  importLabEquipment: async (file: File, labId?: number): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity', 'lab-equipment');
    if (labId) {
      formData.append('lab_id', labId.toString());
    }
    const response = await api.post('/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/');
    return extractResults<Notification>(response.data);
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/notifications/unread-count/');
    return response.data;
  },

  markAsRead: async (id: number): Promise<{ detail: string }> => {
    const response = await api.patch(`/notifications/${id}/read/`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ detail: string }> => {
    const response = await api.patch('/notifications/read-all/');
    return response.data;
  },

  sendSms: async (data: { id: number; lab: string; issue_description: string; created_at: string; admin_phone: string }): Promise<{ detail: string }> => {
    const response = await api.post('/notifications/send-sms/', data);
    return response.data;
  },

  // Legacy fallback
  sendMaintenanceNotification: async (data: MaintenanceNotification): Promise<boolean> => {
    const response = await api.post('/notifications/maintenance/', data);
    return response.data;
  },
};

// Muster API
export const musterAPI = {
  createSession: async (data: { 
    date: string; 
    time: string; 
    lab: number; 
    class_name: string; 
    batch: string 
  }): Promise<{ id: number }> => {
    const response = await api.post('/muster/sessions/', data);
    return response.data;
  },
  
  listSessions: async (): Promise<Array<{
    id: number;
    date: string;
    time: string;
    lab: number;
    lab_name: string;
    class_name: string;
    batch: string;
    created_at: string;
    entry_count: number;
  }>> => {
    const response = await api.get('/muster/sessions/');
    return response.data;
  },
  
  getSession: async (sessionId: number): Promise<{
    id: number;
    date: string;
    time: string;
    lab: number;
    lab_name: string;
    class_name: string;
    batch: string;
    created_at: string;
    entries: Array<{
      id: number;
      sr_no: number;
      roll_no: string;
      pc: number;
      pc_name: string;
    }>;
  }> => {
    const response = await api.get(`/muster/sessions/${sessionId}/`);
    return response.data;
  },
  
  updateSession: async (sessionId: number, data: { 
    date: string; 
    time: string; 
    lab: number; 
    class_name: string; 
    batch: string;
    entries: Array<{
      sr_no: number;
      roll_no: string;
      pc: number;
    }>
  }): Promise<{ status: string }> => {
    const response = await api.put(`/muster/sessions/${sessionId}/`, data);
    return response.data;
  },
  
  deleteSession: async (sessionId: number): Promise<{ status: string }> => {
    const response = await api.delete(`/muster/sessions/${sessionId}/`);
    return response.data;
  },
  
  saveEntries: async (sessionId: number, entries: Array<{
    sr_no: number;
    roll_no: string;
    pc: number;
  }>): Promise<{ status: string }> => {
    const response = await api.post(`/muster/sessions/${sessionId}/entries/`, { entries });
    return response.data;
  },
  
  getPCsForLab: async (labId: number): Promise<Array<{ id: number; device_name: string }>> => {
    const response = await api.get(`/muster/pcs/${labId}/`);
    return response.data;
  },
};

// Inventory API
export const inventoryAPI = {
  getAll: async (): Promise<Inventory[]> => {
    const response = await api.get('/inventory/');
    return response.data;
  },
};

export { setTokens, clearTokens, getToken, getRefreshToken };
export default api;