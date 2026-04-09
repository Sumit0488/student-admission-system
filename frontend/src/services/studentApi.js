import api from './api';

const API = '/api/students';

export const getStudents = async (params = {}) => {
  return await api.get(API, { params });
};

export const getStatusCounts = async () => {
  return await api.get(`${API}/counts`);
};

// Merged endpoint: counts + first page of Live students in one round trip.
// Use on initial Students page load to cut latency roughly in half.
export const getStudentsDashboard = async (params = {}) => {
  return await api.get(`${API}/dashboard`, { params });
};

export const getStudentById = async (id) => {
  console.log('GET STUDENT BY ID', id);
  return await api.get(`${API}/${id}`);
};

export const createStudent = async (data) => {
  console.log('CREATE STUDENT');
  return await api.post(API, data);
};

export const updateStudent = async (id, data) => {
  console.log('UPDATE STUDENT', id);
  return await api.put(`${API}/${id}`, data);
};

export const deleteStudent = async (id) => {
  console.log('DELETE STUDENT →  DELETE /api/students/' + id);
  return await api.delete(`${API}/${id}`);
};

export const changeStudentStatus = async (id, status) => {
  console.log('CHANGE STATUS →  PUT /api/students/' + id + '/status', { status });
  return await api.put(`${API}/${id}/status`, { status });
};

export const exportStudents = async (params = {}) => {
  console.log('EXPORT STUDENTS', params);
  return await api.get(`${API}/export`, { params, responseType: 'blob' });
};

export const exportFullReport = async () => {
  console.log('EXPORT FULL REPORT');
  return await api.get(`${API}/export/report`, { responseType: 'blob' });
};

export const getDistinctPrograms = async () => {
  return await api.get(`${API}/programs`);
};

// Search by USN — returns first exact match or null
export const getStudentByUSN = async (usn) => {
  const res = await api.get(API, { params: { q: usn, limit: 5 } });
  const list = res.data?.data?.students || [];
  const exact = list.find((s) => (s.student_id || '').toUpperCase() === usn.toUpperCase());
  return exact || null;
};

// ── Bulk operations ───────────────────────────────────────────────────────────
// POST /api/students/bulk-update  { studentIds, action, value }
export const bulkUpdateStudents = (data) => api.post(`${API}/bulk-update`, data);

// POST /api/students/bulk-export  { studentIds } → CSV blob
export const bulkExportStudents = (data) =>
  api.post(`${API}/bulk-export`, data, { responseType: 'blob' });

// GET /api/students/:id/audit-logs
export const getAuditLogs = (id) => api.get(`${API}/${id}/audit-logs`);
