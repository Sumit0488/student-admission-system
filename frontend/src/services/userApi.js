import api from './api';

export const getUsers = (params) => api.get('/api/users', { params });
export const createUser = (data) => api.post('/api/users', data);
export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);
export const deactivateUser = (id) => api.delete(`/api/users/${id}`);
export const activateUser = (id) => api.post(`/api/users/${id}/activate`);
