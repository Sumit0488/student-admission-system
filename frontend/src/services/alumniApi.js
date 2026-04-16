import api from './api';

export const getAlumni = (params) => api.get('/api/alumni', { params });
export const getAlumniStats = () => api.get('/api/alumni/stats');
export const getAlumniById = (id) => api.get(`/api/alumni/${id}`);
export const createAlumni = (data) => api.post('/api/alumni', data);
export const updateAlumni = (id, data) => api.put(`/api/alumni/${id}`, data);
export const deleteAlumni = (id) => api.delete(`/api/alumni/${id}`);
