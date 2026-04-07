import api from './api';

const BASE = '/api/auth';

export const login = (data) => api.post(`${BASE}/login`, data);
export const register = (data) => api.post(`${BASE}/register`, data);
export const getMe = () => api.get(`${BASE}/me`);
export const addUser = (data) => api.post(`${BASE}/add-user`, data);
