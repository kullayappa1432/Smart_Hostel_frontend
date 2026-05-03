import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach Token ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Skip token for public auth endpoints
    const isAuthEndpoint = 
      config.url?.includes('/auth/login') || 
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/reset-password');
    
    if (isAuthEndpoint) {
      return config;
    }

    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor: Handle 401 Errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging (skip 404 as they're often expected)
    if (error.response && error.response.status !== 404) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data,
      });
    }

    // Handle 401 Unauthorized - Invalid or expired token
    if (error.response?.status === 401) {
      // Only redirect if not already on auth pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/register');
        
        if (!isAuthPage) {
          // Clear all auth data
          localStorage.removeItem('token');
          localStorage.removeItem('hostel-auth'); // Zustand persist storage
          
          // Show user-friendly message
          console.warn('Session expired. Redirecting to login...');
          
          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register/student', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStudentDashboard: () =>
    Promise.all([
      api.get('/allocations/my-room').catch(() => ({ data: { data: null } })),
      api.get('/payments/my-payments').catch(() => ({ data: { data: [] } })),
      api.get('/attendance/my-attendance').catch(() => ({ data: { data: { summary: {} } } })),
      api.get('/notifications/my').catch(() => ({ data: { data: { notifications: [], unreadCount: 0 } } })),
    ]),
};

// ─── Rooms ────────────────────────────────────────────────────────────────────
export const roomsApi = {
  getAvailableRooms: () => api.get('/rooms/available/for-me'),
  getAllRooms: (params?: any) => api.get('/rooms', { params }),
  getRoomById: (id: string) => api.get(`/rooms/${id}`),
  createRoom: (data: any) => api.post('/rooms', data),
  updateRoom: (id: string, data: any) => api.patch(`/rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/rooms/${id}`),
  selfAllocate: (room_id: number) => api.post('/allocations/self', { room_id }),
  adminAllocate: (data: any) => api.post('/allocations/admin', data),
  getMyAllocation: () => api.get('/allocations/my-room'),
  getAllAllocations: (params?: any) => api.get('/allocations', { params }),
  deallocate: (id: string) => api.delete(`/allocations/${id}`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getMyPayments: () => api.get('/payments/my-payments'),
  getAllPayments: (params?: any) => api.get('/payments', { params }),
  createOrder: (data: any) => api.post('/payments/create-order', data),
  verifyPayment: (data: any) => api.post('/payments/verify', data),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceApi = {
  getMyAttendance: (semesterId?: number) =>
    api.get('/attendance/my-attendance', { params: semesterId ? { semesterId } : {} }),
  getAllAttendance: (params?: any) => api.get('/attendance', { params }),
  markAttendance: (data: any) => api.post('/attendance', data),
  markBulk: (records: any[]) => api.post('/attendance/bulk', { records }),
};

// ─── Complaints ───────────────────────────────────────────────────────────────
export const complaintsApi = {
  getMyComplaints: () => api.get('/complaints/my-complaints'),
  getAllComplaints: (params?: any) => api.get('/complaints', { params }),
  createComplaint: (data: any) => api.post('/complaints', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/complaints/${id}/status`, { status }),
};

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const menuApi = {
  getTodayMenu: () => api.get('/menu/today'),
  getAllMenus: (params?: any) => api.get('/menu', { params }),
  createMenu: (data: any) => api.post('/menu', data),
  updateMenu: (id: string, data: any) => api.patch(`/menu/${id}`, data),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getMyNotifications: () => api.get('/notifications/my'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  broadcast: (data: any) => api.post('/notifications/broadcast', data),
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentsApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};

// ─── Departments & Semesters ──────────────────────────────────────────────────
export const departmentsApi = {
  getAll: () => api.get('/departments'),
  create: (data: any) => api.post('/departments', data),
};

export const semestersApi = {
  getAll: () => api.get('/semesters'),
  getActive: () => api.get('/semesters/active'),
  create: (data: any) => api.post('/semesters', data),
};

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staffApi = {
  getAll: () => api.get('/staff'),
  create: (data: any) => api.post('/staff', data),
  update: (id: string, data: any) => api.patch(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

// ─── Fees ─────────────────────────────────────────────────────────────────────
export const feesApi = {
  getAll: (params?: any) => api.get('/fees', { params }),
  getById: (id: string) => api.get(`/fees/${id}`),
  create: (data: any) => api.post('/fees', data),
  update: (id: string, data: any) => api.patch(`/fees/${id}`, data),
  delete: (id: string) => api.delete(`/fees/${id}`),
  getMyFees: () => api.get('/fees/my-fees'),
  getMySummary: () => api.get('/fees/my-summary'),
  getPending: (studentId: string) => api.get(`/fees/pending/${studentId}`),
  getSummary: (studentId: string) => api.get(`/fees/summary/${studentId}`),
};

// ─── Fee Payments ─────────────────────────────────────────────────────────────
export const feePaymentsApi = {
  getAll: (params?: any) => api.get('/fee-payments', { params }),
  getById: (id: string) => api.get(`/fee-payments/${id}`),
  create: (data: any) => api.post('/fee-payments', data),
  delete: (id: string) => api.delete(`/fee-payments/${id}`),
  getMyPayments: () => api.get('/fee-payments/my-payments'),
  getHistory: (studentId: string) => api.get(`/fee-payments/history/${studentId}`),
  // Razorpay
  createOrder: (feeId: string) => api.post(`/fee-payments/create-order/${feeId}`),
  verifyPayment: (data: {
    fee_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post('/fee-payments/verify', data),
};

// ─── Leave Requests ───────────────────────────────────────────────────────────
export const leaveRequestsApi = {
  getAll: (params?: any) => api.get('/leave-requests', { params }),
  getById: (id: string) => api.get(`/leave-requests/${id}`),
  create: (data: any) => api.post('/leave-requests', data),
  update: (id: string, data: any) => api.patch(`/leave-requests/${id}`, data),
  delete: (id: string) => api.delete(`/leave-requests/${id}`),
  approve: (id: string, data: { status: string; remarks?: string }) =>
    api.patch(`/leave-requests/${id}/approve`, data),
  getPending: () => api.get('/leave-requests/pending'),
  getActive: () => api.get('/leave-requests/active'),
};

// ─── Visitors ─────────────────────────────────────────────────────────────────
export const visitorsApi = {
  getAll: (params?: any) => api.get('/visitors', { params }),
  getById: (id: string) => api.get(`/visitors/${id}`),
  create: (data: any) => api.post('/visitors', data),
  checkOut: (id: string, data: { check_out_time: string }) =>
    api.patch(`/visitors/${id}/checkout`, data),
  delete: (id: string) => api.delete(`/visitors/${id}`),
  getActive: () => api.get('/visitors/active'),
  getHistory: (studentId: string) => api.get(`/visitors/history/${studentId}`),
};

// ─── Attender ─────────────────────────────────────────────────────────────────
export const attenderApi = {
  getDashboard: (date?: string) =>
    api.get('/attender/dashboard', { params: date ? { date } : {} }),
  recordExpense: (data: {
    student_id: number;
    expense_type: 'FOOD' | 'MAINTENANCE' | 'OTHER';
    amount: number;
    date?: string;
    remarks?: string;
  }) => api.post('/attender/expenses', data),
  getExpenses: (params?: {
    student_id?: number;
    expense_type?: string;
    from_date?: string;
    to_date?: string;
  }) => api.get('/attender/expenses', { params }),
  getMonthlySummary: (month?: number, year?: number) =>
    api.get('/attender/monthly-summary', { params: { month, year } }),
  getPendingPayments: () => api.get('/attender/pending-payments'),
  getTodayAttendance: (date?: string) =>
    api.get('/attender/today-attendance', { params: date ? { date } : {} }),
};

// ─── Attender Staff Management ────────────────────────────────────────────────
export const attenderStaffApi = {
  getAll: (params?: { is_active?: boolean; search?: string }) =>
    api.get('/attender/staff', { params }),
  getById: (id: number) => api.get(`/attender/staff/${id}`),
  create: (data: {
    name: string;
    phone: string;
    email: string;
    address?: string;
  }) => api.post('/attender/staff', data),
  update: (id: number, data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active?: boolean;
  }) => api.put(`/attender/staff/${id}`, data),
  delete: (id: number) => api.delete(`/attender/staff/${id}`),
  toggleStatus: (id: number) => api.put(`/attender/staff/${id}/toggle-status`),
};
