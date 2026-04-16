import api from './api';

// Members
export const getHostelStudents = (params) => api.get('/api/hostel/students', { params });
export const getHostelStudent = (id) => api.get(`/api/hostel/students/${id}`);
export const getHostelStats = () => api.get('/api/hostel/students/stats');
export const createHostelStudent = (data) => api.post('/api/hostel/students', data);
export const updateHostelStudent = (id, data) => api.put(`/api/hostel/students/${id}`, data);
export const deleteHostelStudent = (id) => api.delete(`/api/hostel/students/${id}`);
export const collectHostelFee = (id, data) => api.post(`/api/hostel/students/${id}/collect`, data);

// Assets
export const getHostelAssets = (params) => api.get('/api/hostel/assets', { params });
export const getHostelAsset = (id) => api.get(`/api/hostel/assets/${id}`);
export const createHostelAsset = (data) => api.post('/api/hostel/assets', data);
export const updateHostelAsset = (id, data) => api.put(`/api/hostel/assets/${id}`, data);
export const deleteHostelAsset = (id) => api.delete(`/api/hostel/assets/${id}`);
export const returnHostelAsset = (id, data) => api.post(`/api/hostel/assets/${id}/return`, data);

// Events
export const getHostelEvents = (params) => api.get('/api/hostel/events', { params });
export const getHostelEvent = (id) => api.get(`/api/hostel/events/${id}`);
export const createHostelEvent = (data) => api.post('/api/hostel/events', data);
export const updateHostelEvent = (id, data) => api.put(`/api/hostel/events/${id}`, data);
export const deleteHostelEvent = (id) => api.delete(`/api/hostel/events/${id}`);

// Timesheet
export const getHostelTimesheet = (params) => api.get('/api/hostel/timesheet', { params });
export const createHostelTimesheet = (data) => api.post('/api/hostel/timesheet', data);
export const bulkCreateTimesheet = (data) => api.post('/api/hostel/timesheet/bulk', data);
export const updateHostelTimesheet = (id, data) => api.put(`/api/hostel/timesheet/${id}`, data);
export const deleteHostelTimesheet = (id) => api.delete(`/api/hostel/timesheet/${id}`);

// Devices
export const getHostelDevices = (params) => api.get('/api/hostel/devices', { params });
export const getHostelDevice = (id) => api.get(`/api/hostel/devices/${id}`);
export const createHostelDevice = (data) => api.post('/api/hostel/devices', data);
export const updateHostelDevice = (id, data) => api.put(`/api/hostel/devices/${id}`, data);
export const deleteHostelDevice = (id) => api.delete(`/api/hostel/devices/${id}`);
export const assignHostelDevice = (id, data) => api.post(`/api/hostel/devices/${id}/assign`, data);
export const returnHostelDevice = (id, data) => api.post(`/api/hostel/devices/${id}/return`, data);
