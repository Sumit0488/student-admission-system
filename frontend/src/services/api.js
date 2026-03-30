import axios from 'axios';

// In production on Vercel the frontend and API share the same domain, so the
// base URL is empty (relative). Override with VITE_API_URL for a separate
// backend deployment (e.g. Render).
const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: BASE_URL });

// Guard: if the server returns HTML instead of JSON it means the API route
// was not reached (Vercel routing misconfiguration, cold-start crash, etc.).
// Convert that into a clear error instead of crashing downstream.
api.interceptors.response.use(
  (response) => {
    const ct = response.headers['content-type'] || '';
    if (ct.includes('text/html')) {
      return Promise.reject(
        new Error('API returned HTML — backend may be unreachable. Check MONGO_URI and Vercel function logs.')
      );
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;
