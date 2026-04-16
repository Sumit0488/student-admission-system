import api from './api';

// Streams
export const getStreams = () => api.get('/api/academic/streams');
export const createStream = (data) => api.post('/api/academic/streams', data);
export const updateStream = (id, data) => api.put(`/api/academic/streams/${id}`, data);
export const deleteStream = (id) => api.delete(`/api/academic/streams/${id}`);

// Academic Programs
export const getAcademicPrograms = (params) => api.get('/api/academic/programs', { params });
export const createAcademicProgram = (data) => api.post('/api/academic/programs', data);
export const updateAcademicProgram = (id, data) => api.put(`/api/academic/programs/${id}`, data);
export const deleteAcademicProgram = (id) => api.delete(`/api/academic/programs/${id}`);
