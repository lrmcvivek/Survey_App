import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'SUPERVISOR' | 'SURVEYOR';
}
export interface LoginResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    role: string;
  };
}

export interface RegisterRequest {
  name: string;
  username: string;
  password: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'SUPERVISOR' | 'SURVEYOR';
  mobileNumber: string;
}

export interface User {
  userId: string;
  username: string;
  name: string | null;
  mobileNumber?: string;
  isActive: boolean;
  role?: string; // Direct role field from backend
  createdAt?: string; // isCreatedAt from backend
  userRoleMaps?: Array<{
    role: {
      roleName: string;
    };
  }>;
}

// Role hierarchy ranking (higher number = higher authority)
export const ROLE_RANK: { [key: string]: number } = {
  SUPERADMIN: 4,
  ADMIN: 3,
  SUPERVISOR: 2,
  SURVEYOR: 1,
  VIEWER: 0,
};

// Helper function to get user's highest role rank
export function getUserRoleRank(user: User | { userId: string; username: string; role: string; name?: string; mobileNumber?: string; isActive: boolean }): number {
  let roleName = '';
  if ('role' in user && typeof user.role === 'string') {
    roleName = user.role;
  } else if ('userRoleMaps' in user) {
    roleName = (user as User).role || user.userRoleMaps?.[0]?.role?.roleName || '';
  }
  return ROLE_RANK[roleName] || 0;
}

// Helper function to check if requesting user can manage target user
export function canManageUser(currentUser: User | { userId: string; username: string; role: string; name?: string; mobileNumber?: string; isActive: boolean }, targetUser: User): boolean {
  const currentUserRank = getUserRoleRank(currentUser);
  const targetUserRank = getUserRoleRank(targetUser);
  
  // User can only manage users with lower role rank
  return currentUserRank > targetUserRank;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<any> => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  assignRole: async (data: { userId: string; role: string; reason?: string }): Promise<any> => {
    const response = await apiClient.post('/api/user/assign-role', data);
    return response.data;
  },
};

// User API
export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/user/profile');
    return response.data;
  },

  updateProfile: async (data: any): Promise<any> => {
    const response = await apiClient.put('/api/user/profile', data);
    return response.data;
  },

  changePassword: async (data: any): Promise<any> => {
    const response = await apiClient.put('/api/user/change-password', data);
    return response.data;
  },

  getUsers: async (params?: any): Promise<{ users: User[]; pagination: any }> => {
    const response = await apiClient.get('/api/user', { params });
    return response.data;
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`/api/user/${userId}`);
    return response.data;
  },

  updateUserStatus: async (data: any): Promise<any> => {
    const response = await apiClient.put('/api/user/status', data);
    return response.data;
  },

  updateUser: async (data: any): Promise<any> => {
    const response = await apiClient.put('/api/user/update', data);
    return response.data;
  },

  deleteUser: async (data: any): Promise<any> => {
    const response = await apiClient.delete('/api/user', { data });
    return response.data;
  },

  assignRole: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/user/assign-role', data);
    return response.data;
  },

  removeRole: async (data: any): Promise<any> => {
    const response = await apiClient.delete('/api/user/remove-role', { data });
    return response.data;
  },

  searchUsers: async (params: any): Promise<{ users: User[] }> => {
    const response = await apiClient.get('/api/user/search', { params });
    return response.data;
  },

  getUserStats: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/user/stats', { params });
    return response.data;
  },

  getRoles: async (): Promise<any> => {
    const response = await apiClient.get('/api/user/roles');
    return response.data;
  },

  getUsersByRole: async (role: string): Promise<{ users: User[] }> => {
    const response = await apiClient.get(`/api/user/by-role/${role}`);
    return response.data;
  },

  getActiveUsersCount: async (): Promise<any> => {
    const response = await apiClient.get('/api/user/count/active');
    return response.data;
  },
};

// Ward API
export const wardApi = {
  assignSurveyor: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/ward/assign-surveyor', data);
    return response.data;
  },

  assignSupervisor: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/ward/assign-supervisor', data);
    return response.data;
  },

  bulkAssign: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/ward/bulk-assign', data);
    return response.data;
  },

  updateAssignment: async (data: any): Promise<any> => {
    const response = await apiClient.put('/api/ward/update-assignment', data);
    return response.data;
  },

  toggleAccess: async (data: any): Promise<any> => {
    const response = await apiClient.put('/api/ward/toggle-access', data);
    return response.data;
  },

  assignSupervisorToWard: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/ward/assign-supervisor-to-ward', data);
    return response.data;
  },

  removeSupervisorFromWard: async (data: any): Promise<any> => {
    const response = await apiClient.delete('/api/ward/remove-supervisor-from-ward', { data });
    return response.data;
  },

  // Update ward status - Using REST-style endpoint
  updateWardStatus: async (wardId: string, wardStatusId: number): Promise<any> => {
    const response = await apiClient.put(`/api/ward/${wardId}/status`, { wardStatusId });
    return response.data;
  },

  getAssignments: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/ward/assignments', { params });
    return response.data;
  },

  getAvailableWards: async (): Promise<any> => {
    const response = await apiClient.get('/api/wards/available-wards');
    return response.data;
  },

  getAvailableMohallas: async (wardId?: string): Promise<any> => {
    const params = wardId ? { wardId } : {};
    const response = await apiClient.get('/api/wards/available-mohallas', { params });
    return response.data;
  },

  getWardMohallaMappings: async (): Promise<any> => {
    const response = await apiClient.get('/api/ward/ward-mohalla-mappings');
    return response.data;
  },

  getSurveyorsByWard: async (wardId: string): Promise<any> => {
    const response = await apiClient.get(`/api/ward/surveyors/${wardId}`);
    return response.data;
  },

  getSupervisorsByWard: async (wardId: string): Promise<any> => {
    const response = await apiClient.get(`/api/ward/supervisors/${wardId}`);
    return response.data;
  },
};

// Surveyor API
export const surveyorApi = {
  assignWard: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/surveyor/assign-ward', data);
    return response.data;
  },

  toggleLogin: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/surveyor/toggle-login', data);
    return response.data;
  },

  getAssignments: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/api/surveyor/assignments/${userId}`);
    return response.data;
  },

  removeAssignment: async (data: any): Promise<any> => {
    const response = await apiClient.delete('/api/surveyor/remove-assignment', { data });
    return response.data;
  },

  getProfile: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/api/surveyor/profile/${userId}`);
    return response.data;
  },
};

// QC API
export const qcApi = {
  createQC: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/qc/create', data);
    return response.data;
  },

  updateQC: async (qcRecordId: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/qc/${qcRecordId}`, data);
    return response.data;
  },

  getPendingSurveys: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/qc/pending', { params });
    return response.data;
  },

  getQCStats: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/qc/stats', { params });
    return response.data;
  },

  bulkApprove: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/qc/bulk-approve', data);
    return response.data;
  },

  bulkReject: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/qc/bulk-reject', data);
    return response.data;
  },

  getQCBySurvey: async (surveyUniqueCode: string): Promise<any> => {
    const response = await apiClient.get(`/api/qc/survey/${surveyUniqueCode}`);
    return response.data;
  },

  getQCByUser: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/api/qc/user/${userId}`);
    return response.data;
  },
  
  // Enhanced property list for QC with role-based filtering
  getPropertyList: async (params?: any): Promise<any[]> => {
    const response = await apiClient.get('/api/qc/property-list', { params });
    return response.data;
  },

  // MIS Reports - view-only access
  getMISReports: async (params?: any): Promise<any[]> => {
    const response = await apiClient.get('/api/qc/mis-reports', { params });
    return response.data;
  },

  // QC remarks summary for a survey
  getQCRemarksSummary: async (surveyUniqueCode: string): Promise<any> => {
    const response = await apiClient.get(`/api/qc/remarks/${surveyUniqueCode}`);
    return response.data;
  },

  // QC record for specific level
  getQCByLevel: async (surveyUniqueCode: string, qcLevel: number): Promise<any> => {
    const response = await apiClient.get(`/api/qc/level/${surveyUniqueCode}/${qcLevel}`);
    return response.data;
  },

  // Update survey QC with enhanced level progression
  updateSurveyQC: async (surveyUniqueCode: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/qc/survey/${surveyUniqueCode}`, data);
    return response.data;
  },

  // Bulk QC action with level support
  bulkQCAction: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/qc/bulk-qc', data);
    return response.data;
  },

  // Get full property details for QC edit
  getPropertyDetails: async (surveyUniqueCode: string): Promise<any> => {
    const response = await apiClient.get(`/api/qc/property/${surveyUniqueCode}`);
    return response.data;
  },

  // Get QC history for a survey
  getQCHistory: async (surveyUniqueCode: string): Promise<any> => {
    const response = await apiClient.get(`/api/qc/history/${surveyUniqueCode}`);
    return response.data;
  },
};

// Survey API
export const surveyApi = {
  getAllSurveys: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/surveys', { params });
    return response.data;
  },

  getSurveyById: async (surveyUniqueCode: string): Promise<any> => {
    const response = await apiClient.get(`/api/surveys/${surveyUniqueCode}`);
    return response.data;
  },

  syncSurvey: async (surveyUniqueCode: string): Promise<any> => {
    const response = await apiClient.post(`/api/surveys/${surveyUniqueCode}/sync`);
    return response.data;
  },

  bulkSync: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/surveys/bulk-sync', data);
    return response.data;
  },

  getSurveyStats: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/surveys/stats', { params });
    return response.data;
  },

  getSurveysByWard: async (wardId: string): Promise<any> => {
    const response = await apiClient.get(`/api/surveys/ward/${wardId}`);
    return response.data;
  },

  getSurveysByUser: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/api/surveys/user/${userId}`);
    return response.data;
  },

  getSurveysByStatus: async (status: string): Promise<any> => {
    const response = await apiClient.get(`/api/surveys/status/${status}`);
    return response.data;
  },

  searchSurveys: async (params: any): Promise<any> => {
    const response = await apiClient.get('/api/surveys/search', { params });
    return response.data;
  },

  submitSurvey: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/surveys/submit', data);
    return response.data;
  },

  getSurveyByGisId: async (gisId: string): Promise<any> => {
    const response = await apiClient.get(`/api/surveys/gis/${gisId}`);
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  getDashboardStats: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/reports/dashboard', { params });
    return response.data;
  },

  getSurveyAnalytics: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/reports/survey-analytics', { params });
    return response.data;
  },

  getUserAnalytics: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/reports/user-analytics', { params });
    return response.data;
  },

  getWardAnalytics: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/reports/ward-analytics', { params });
    return response.data;
  },

  getQCAnalytics: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/reports/qc-analytics', { params });
    return response.data;
  },

  exportReport: async (format: string, params?: any): Promise<any> => {
    const response = await apiClient.get(`/api/reports/export/${format}`, { 
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  getSystemHealth: async (): Promise<any> => {
    const response = await apiClient.get('/api/reports/system-health');
    return response.data;
  },

  getRecentActivity: async (filter?: string): Promise<any> => {
    const response = await apiClient.get('/api/reports/recent-activity', { params: filter ? { filter } : {} });
    return response.data;
  },
};

// Master Data API
export const masterDataApi = {
  // ULB Master Data
  getAllUlbs: async (): Promise<any> => {
    const response = await apiClient.get('/api/ulbs');
    return response.data;
  },

  getUlbsWithStats: async (): Promise<any> => {
    const response = await apiClient.get('/api/ulbs/with-stats');
    return response.data;
  },

  getUlbById: async (ulbId: string): Promise<any> => {
    const response = await apiClient.get(`/api/ulbs/${ulbId}`);
    return response.data;
  },

  createUlb: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/ulbs', data);
    return response.data;
  },

  updateUlb: async (ulbId: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/ulbs/${ulbId}`, data);
    return response.data;
  },

  deleteUlb: async (ulbId: string): Promise<any> => {
    const response = await apiClient.delete(`/api/ulbs/${ulbId}`);
    return response.data;
  },

  // Zone Master Data
  getAllZones: async (): Promise<any> => {
    const response = await apiClient.get('/api/zones');
    return response.data;
  },

  getZonesByUlb: async (ulbId: string): Promise<any> => {
    const response = await apiClient.get(`/api/zones/ulb/${ulbId}`);
    return response.data;
  },

  getZoneById: async (zoneId: string): Promise<any> => {
    const response = await apiClient.get(`/api/zones/${zoneId}`);
    return response.data;
  },

  createZone: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/zones', data);
    return response.data;
  },

  updateZone: async (zoneId: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/zones/${zoneId}`, data);
    return response.data;
  },

  deleteZone: async (zoneId: string): Promise<any> => {
    const response = await apiClient.delete(`/api/zones/${zoneId}`);
    return response.data;
  },

  // Ward Master Data
  getAllWards: async (): Promise<any> => {
    const response = await apiClient.get('/api/wards');
    return response.data;
  },

  getAllWardsWithStatus: async (): Promise<any> => {
    const response = await apiClient.get('/api/wards/with-status');
    return response.data;
  },

  // Add method to get ward with zone information
  getWardWithZone: async (wardId: string): Promise<any> => {
    const response = await apiClient.get(`/api/wards/${wardId}`);
    return response.data;
  },

  // Debug endpoint for ward status
  debugWardStatus: async (wardId: string): Promise<any> => {
    const response = await apiClient.get(`/api/wards/debug/${wardId}`);
    return response.data;
  },

  searchWards: async (searchTerm: string): Promise<any> => {
    const response = await apiClient.get('/api/wards/search', { 
      params: { search: searchTerm } 
    });
    return response.data;
  },

  getWardsByZone: async (zoneId: string): Promise<any> => {
    const response = await apiClient.get(`/api/wards/zone/${zoneId}`);
    return response.data;
  },

  getWardById: async (wardId: string): Promise<any> => {
    const response = await apiClient.get(`/api/wards/${wardId}`);
    return response.data;
  },

  createWard: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/wards', data);
    return response.data;
  },

  updateWard: async (wardId: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/wards/${wardId}`, data);
    return response.data;
  },

  deleteWard: async (wardId: string): Promise<any> => {
    const response = await apiClient.delete(`/api/wards/${wardId}`);
    return response.data;
  },

  updateWardStatus: async (wardId: string, wardStatusId: number) => {
    const response = await apiClient.put(`/api/wards/${wardId}/status`, { wardStatusId });
    return response.data;
  },

  // Mohalla Master Data
  getAllMohallas: async (): Promise<any> => {
    const response = await apiClient.get('/api/mohallas');
    return response.data;
  },

  searchMohallas: async (searchTerm: string): Promise<any> => {
    const response = await apiClient.get('/api/mohallas/search', { 
      params: { search: searchTerm } 
    });
    return response.data;
  },

  getMohallasByWard: async (wardId: string): Promise<any> => {
    const response = await apiClient.get(`/api/mohallas/ward/${wardId}`);
    return response.data;
  },

  getMohallaById: async (mohallaId: string): Promise<any> => {
    const response = await apiClient.get(`/api/mohallas/${mohallaId}`);
    return response.data;
  },

  createMohalla: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/mohallas', data);
    return response.data;
  },

  updateMohalla: async (mohallaId: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/mohallas/${mohallaId}`, data);
    return response.data;
  },

  deleteMohalla: async (mohallaId: string): Promise<any> => {
    const response = await apiClient.delete(`/api/mohallas/${mohallaId}`);
    return response.data;
  },

  // Ward Status Master Data
  getAllWardStatuses: async (): Promise<any> => {
    const response = await apiClient.get('/api/wards/statuses');
    return response.data;
  },

  // Mapping APIs
  getWardMohallaMappings: async (): Promise<any> => {
    const response = await apiClient.get('/api/ward/ward-mohalla-mappings');
    return response.data;
  },

  // New assignment-aware APIs
  getAvailableWards: async (zoneId?: string): Promise<any> => {
    const params = zoneId ? { zoneId } : {};
    const response = await apiClient.get('/api/wards/available-wards', { params });
    return response.data;
  },

  getAvailableMohallas: async (wardId?: string): Promise<any> => {
    const params = wardId ? { wardId } : {};
    const response = await apiClient.get('/api/wards/available-mohallas', { params });
    return response.data;
  },

  getZoneWardMappings: async (): Promise<any> => {
    const response = await apiClient.get('/api/zones/ward-mappings');
    return response.data;
  },

  getUlbZoneMappings: async (): Promise<any> => {
    const response = await apiClient.get('/api/ulbs/zone-mappings');
    return response.data;
  },

  getWardsByZoneWithStatus: async (zoneId: string, statusName: string = 'STARTED') => {
    const response = await apiClient.get(`/api/wards/zone/${zoneId}/with-status`, {
      params: { status: statusName }
    });
    return response.data;
  },

  // Survey Type Master Data
  getSurveyTypes: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/master-data/survey-types');
    return response.data;
  },

  getAllMasterData: async (): Promise<any> => {
    const response = await apiClient.get('/api/master-data/all');
    return response.data;
  },
  
  getNrPropertySubCategories: async (categoryId?: number): Promise<any[]> => {
    const params = categoryId ? { categoryId } : {};
    const response = await apiClient.get('/api/master-data/nr-property-sub-categories', { params });
    return response.data;
  },
};

// Survey Status APIs
export const surveyStatusApi = {
  getAllWardStatuses: async () => {
    const response = await apiClient.get('/api/wards/statuses');
    return response.data;
  },
  updateWardStatus: async (wardId: string, statusId: number) => {
    const response = await apiClient.put(`/api/wards/${wardId}/status`, { wardStatusId: statusId });
    return response.data;
  },
  updateMohallaStatus: async (mohallaId: string, statusId: number) => {
    const response = await apiClient.put(`/api/mohallas/${mohallaId}/status`, { statusId });
    return response.data;
  },
};

// Assignment Management API
export const assignmentApi = {
  // Get all assignments for a user
  getAssignmentsByUser: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/api/assignments/user/${userId}`);
    return response.data;
  },
  // Get all assignments for a ward
  getAssignmentsByWard: async (wardId: string): Promise<any> => {
    const response = await apiClient.get(`/api/assignments/ward/${wardId}`);
    return response.data;
  },
  // Update isActive for an assignment
  updateAssignmentStatus: async (assignmentId: string, isActive: boolean): Promise<any> => {
    const response = await apiClient.patch(`/api/assignments/${assignmentId}/status`, { isActive });
    return response.data;
  },
  // Delete an assignment
  deleteAssignment: async (assignmentId: string): Promise<any> => {
    const response = await apiClient.delete(`/api/assignments/${assignmentId}`);
    return response.data;
  },
  // Get all assignments (admin view)
  getAllAssignments: async (): Promise<any> => {
    const response = await apiClient.get('/api/assignments/');
    return response.data;
  },
  // Bulk assignment
  bulkAssign: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/assignments/bulk', data);
    return response.data;
  },
};

export default apiClient; 
