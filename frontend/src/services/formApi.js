import api from './api';

export const getForms = (params) => api.get('/api/forms', { params });
export const getForm = (id) => api.get(`/api/forms/${id}`);
export const createForm = (data) => api.post('/api/forms', data);
export const updateForm = (id, data) => api.put(`/api/forms/${id}`, data);
export const deleteForm = (id) => api.delete(`/api/forms/${id}`);
