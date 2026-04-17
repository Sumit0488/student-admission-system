import api from './api';

export const getMaintenanceStats = () => api.get('/api/maintenance/stats');
export const runBackfillReceipts = () => api.post('/api/maintenance/backfill-receipts');
