import api from './api';

// ── Config (global dropdown data for all forms) ───────────────────────────────
export const getAllConfig        = ()         => api.get('/api/config');
export const getConfigByType    = (type)     => api.get(`/api/config/${type}`);

// ── Master Data (academic settings CRUD) ─────────────────────────────────────
export const getMasterData      = (type)     => api.get('/api/master-data', { params: { type } });
export const addMasterData      = (data)     => api.post('/api/master-data', data);
export const updateMasterData   = (id, data) => api.put(`/api/master-data/${id}`, data);
export const deleteMasterData   = (id)       => api.delete(`/api/master-data/${id}`);
export const seedMasterData     = ()         => api.post('/api/master-data/seed');
export const getMasterDataTypes = ()         => api.get('/api/master-data/types');

// ── Typed convenience helpers ─────────────────────────────────────────────────
export const getPrograms          = () => getMasterData('program');
export const getBatches           = () => getMasterData('batch');
export const getStreams            = () => getMasterData('stream');
export const getAcademicYears     = () => getMasterData('academic_year');
export const getAdmissionStatuses = () => getMasterData('admission_status');
export const getQuotas            = () => getMasterData('quota');

// ── Institution ───────────────────────────────────────────────────────────────
export const getInstitution = () => api.get('/api/master-data', { params: { type: 'institution' } });
