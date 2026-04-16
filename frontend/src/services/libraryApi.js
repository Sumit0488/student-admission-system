import api from './api';

export const getLibraryMembers = (params) => api.get('/api/library/members', { params });
export const getLibraryMember = (id) => api.get(`/api/library/members/${id}`);
export const getLibraryStats = () => api.get('/api/library/members/stats');
export const createLibraryMember = (data) => api.post('/api/library/members', data);
export const updateLibraryMember = (id, data) => api.put(`/api/library/members/${id}`, data);
export const deleteLibraryMember = (id) => api.delete(`/api/library/members/${id}`);
export const collectLibraryFee = (id, data) => api.post(`/api/library/members/${id}/collect`, data);
