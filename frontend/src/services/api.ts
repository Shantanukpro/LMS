import axios from 'axios';
import type { 
  User, Lab, PC, LabEquipment, NetworkEquipmentDetails, ServerDetails,
  ProjectorDetails, ElectricalApplianceDetails, CPU, OS, Peripheral, Software, 
  MaintenanceLog, ImportResult, BulkImportRequest, MaintenanceNotification,
  LoginRequest, RegisterRequest, AuthResponse, MusterSession, MusterSessionCreate, MusterEntry
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

// Tickets API
export const ticketsAPI = {
  create: async (payload: { title: string; description?: string }): Promise<{ id: number; title: string; description?: string; status: string; created_at: string }> => {
    const response = await api.post('/tickets/create/', payload);
    return response.data;
  },
  listMy: async (): Promise<Array<{ id: number; title: string; description?: string; status: string; created_at: string }>> => {
    const response = await api.get('/tickets/my/');
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
  // Debug Logging
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

// Response interceptor to handle token refresh and global errors
api.interceptors.response.use(
  (response) => {
    // Debug Logging
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
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

// LabEquipment API (comprehensive equipment management)
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

  // Network equipment details
  updateNetworkDetails: async (equipmentId: number, data: Partial<NetworkEquipmentDetails>): Promise<NetworkEquipmentDetails> => {
    const response = await api.patch(`/lab-equipment/${equipmentId}/network-details/`, data);
    return response.data;
  },

  // Server details
  updateServerDetails: async (equipmentId: number, data: Partial<ServerDetails>): Promise<ServerDetails> => {
    const response = await api.patch(`/lab-equipment/${equipmentId}/server-details/`, data);
    return response.data;
  },

  // Projector details
  updateProjectorDetails: async (equipmentId: number, data: Partial<ProjectorDetails>): Promise<ProjectorDetails> => {
    const response = await api.patch(`/lab-equipment/${equipmentId}/projector-details/`, data);
    return response.data;
  },

  // Electrical appliance details
  updateElectricalDetails: async (equipmentId: number, data: Partial<ElectricalApplianceDetails>): Promise<ElectricalApplianceDetails> => {
    const response = await api.patch(`/lab-equipment/${equipmentId}/electrical-details/`, data);
    return response.data;
  },
};

// PCs API with enhanced functionality
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

  // CPU management
  getCPU: async (pcId: number): Promise<CPU> => {
    const response = await api.get(`/pcs/${pcId}/cpu/`);
    return response.data;
  },

  updateCPU: async (pcId: number, data: Partial<CPU>): Promise<CPU> => {
    const response = await api.patch(`/pcs/${pcId}/cpu/`, data);
    return response.data;
  },

  // OS management
  getOS: async (pcId: number): Promise<OS> => {
    const response = await api.get(`/pcs/${pcId}/os/`);
    return response.data;
  },

  updateOS: async (pcId: number, data: Partial<OS>): Promise<OS> => {
    const response = await api.patch(`/pcs/${pcId}/os/`, data);
    return response.data;
  },

  // Peripherals management
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

// Maintenance API with enhanced functionality
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
  
  create: async (data: Omit<MaintenanceLog, 'id' | 'reported_on' | 'fixed_on'>): Promise<MaintenanceLog> => {
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

// Bulk Import API
export const importAPI = {
  importLabs: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/import/labs/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  importPCs: async (file: File, labId?: number): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (labId) {
      formData.append('lab_id', labId.toString());
    }
    const response = await api.post('/import/pcs/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  importLabEquipment: async (file: File, labId?: number): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (labId) {
      formData.append('lab_id', labId.toString());
    }
    const response = await api.post('/import/lab-equipment/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  sendMaintenanceNotification: async (data: MaintenanceNotification): Promise<boolean> => {
    const response = await api.post('/notifications/maintenance/', data);
    return response.data;
  },
};

// Muster API
export const musterAPI = {
  // Create a new muster session
  createSession: async (data: { 
    date: string; 
    time: string; 
    lab: number; 
    class_name: string; 
    batch: string 
  }): Promise<{ id: number }> => {
    const response = await api.post('/muster/api/sessions/', data);
    return response.data;
  },
  
  // Get all muster sessions (for listing)
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
    const response = await api.get('/muster/api/sessions/list/');
    return response.data;
  },
  
  // Get a single muster session with entries
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
    const response = await api.get(`/muster/api/sessions/${sessionId}/`);
    return response.data;
  },
  
  // Update a muster session (including entries)
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
    const response = await api.put(`/muster/api/sessions/${sessionId}/update/`, data);
    return response.data;
  },
  
  // Delete a muster session
  deleteSession: async (sessionId: number): Promise<{ status: string }> => {
    const response = await api.delete(`/muster/api/sessions/${sessionId}/delete/`);
    return response.data;
  },
  
  // Save entries for a session (alternative to updateSession)
  saveEntries: async (sessionId: number, entries: Array<{
    sr_no: number;
    roll_no: string;
    pc: number;
  }>): Promise<{ status: string }> => {
    const response = await api.post(`/muster/api/sessions/${sessionId}/entries/`, { entries });
    return response.data;
  },
  
  // Get PCs for a lab (for dropdowns)
  getPCsForLab: async (labId: number): Promise<Array<{ id: number; device_name: string }>> => {
    const response = await api.get(`/muster/api/pcs/${labId}/`);
    return response.data;
  },
};

export { setTokens, clearTokens, getToken, getRefreshToken };
export default api;