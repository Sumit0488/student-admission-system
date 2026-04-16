import api from './api';

export const getSettings  = ()     => api.get('/api/settings');
export const saveSettings = (data) => api.put('/api/settings', data);
