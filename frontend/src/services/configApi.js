import api from './api';

const BASE = '/api/config';

// Fetches all dropdown data in one request: { programs, batches, statuses }
export const getAllConfig = async () => {
  console.log('GET ALL CONFIG  →  GET /api/config');
  return api.get(BASE);
};

// Master Data CRUD
export const getMasterData = (type) => api.get('/api/master-data', { params: { type } });
export const addMasterData = (data) => api.post('/api/master-data', data);
export const deleteMasterData = (id) => api.delete(`/api/master-data/${id}`);
export const getInstitution = () => api.get('/api/master-data', { params: { type: 'institution' } });
