import api from './api';

const BASE = '/api/config';

// Fetches all dropdown data in one request: { programs, batches, statuses }
export const getAllConfig = async () => {
  console.log('GET ALL CONFIG  →  GET /api/config');
  return api.get(BASE);
};
