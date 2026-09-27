import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('worklog_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Endpoints
export const authApi = {
  requestOtp: (phone) => api.post('/auth/request-otp', { phone }),
  verifyOtp: (phone, otp, requestedRole) => api.post('/auth/verify-otp', { phone, otp, requestedRole }),
  registerWorker: (data) => api.post('/auth/register/worker', data),
  registerContractor: (data) => api.post('/auth/register/contractor', data),
  demoLogin: (role) => api.post('/auth/demo-login', { role }),
  getMe: () => api.get('/auth/me'),
};

// Worker Endpoints
export const workerApi = {
  getDashboard: () => api.get('/worker/dashboard'),
  findWork: (params) => api.get('/worker/find-work', { params }),
  applyJob: (jobId, lat, lng) => api.post('/worker/apply', { jobId, lat, lng }),
  getMyApplications: () => api.get('/worker/my-applications'),
  joinSiteDirect: (inviteCode) => api.post('/worker/join-site', { inviteCode }),
  performCheckIn: (data) => api.post('/worker/checkin', data),
  performCheckOut: (data) => api.post('/worker/checkout', data),
  reportSafety: (data) => api.post('/worker/safety-report', data),
  getWageLedger: () => api.get('/worker/ledger'),
  generateDisputeReport: (data) => api.post('/worker/dispute/generate', data),
  getDisputePdfUrl: (disputeId) => `/api/worker/dispute/${disputeId}/pdf`,
};

// Contractor Endpoints
export const contractorApi = {
  getDashboard: () => api.get('/contractor/dashboard'),
  createSite: (data) => api.post('/contractor/site/new', data),
  getSites: () => api.get('/contractor/sites'),
  postJob: (data) => api.post('/contractor/job/post', data),
  getManageJobs: (params) => api.get('/contractor/jobs/manage', { params }),
  updateJobStatus: (jobId, status) => api.patch(`/contractor/job/${jobId}/status`, { status }),
  acceptApplicant: (applicationId) => api.post('/contractor/applicant/accept', { applicationId }),
  getPendingAttendance: () => api.get('/contractor/attendance/pending'),
  confirmAttendance: (attendanceId, earnedAmount) => api.post('/contractor/attendance/confirm', { attendanceId, earnedAmount }),
  flagAttendance: (attendanceId, flagReason) => api.post('/contractor/attendance/flag', { attendanceId, flagReason }),
  logPayment: (data) => api.post('/contractor/payment/log', data),
  getPaymentHistory: () => api.get('/contractor/payments'),
  getTrustScore: () => api.get('/contractor/trust-score'),
  getSafetyReports: () => api.get('/contractor/safety-reports'),
  resolveSafetyReport: (data) => api.post('/contractor/safety-reports/resolve', data),
};

// Admin Endpoints
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDisputes: (params) => api.get('/admin/disputes', { params }),
  resolveDispute: (data) => api.post('/admin/disputes/resolve', data),
  getLinks: () => api.get('/admin/links'),
  revokeLink: (data) => api.post('/admin/links/revoke', data),
};

// Weather API
export const weatherApi = {
  getSafetyCheck: (lat, lng) => api.get('/weather/safety-check', { params: { lat, lng } }),
};

export default api;
