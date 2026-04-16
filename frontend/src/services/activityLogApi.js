import api from './api';

export const getActivityLogs = (params) => api.get('/api/activity-logs', { params });
export const createActivityLog = (data) => api.post('/api/activity-logs', data);
export const deleteActivityLog = (id) => api.delete(`/api/activity-logs/${id}`);
