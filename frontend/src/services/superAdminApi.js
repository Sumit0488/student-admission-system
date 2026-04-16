import api from './api';

const BASE = '/api/super-admin';

export const getSuperAdminStats = () => api.get(`${BASE}/stats`);
export const getTenants = (params) => api.get(`${BASE}/tenants`, { params });
export const getTenant = (id) => api.get(`${BASE}/tenants/${id}`);
export const createTenant = (data) => api.post(`${BASE}/tenants`, data);
export const updateTenant = (id, data) => api.put(`${BASE}/tenants/${id}`, data);
export const toggleTenant = (id) => api.patch(`${BASE}/tenants/${id}/toggle`);
export const deleteTenant = (id) => api.delete(`${BASE}/tenants/${id}`);
export const impersonateTenant = (tenantId) => api.post(`${BASE}/impersonate/${tenantId}`);
