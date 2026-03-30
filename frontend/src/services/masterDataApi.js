const BASE_URL = import.meta.env.VITE_API_URL || '';

async function safeFetch(url, options = {}) {
  const res = await fetch(BASE_URL + url, options);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/html')) {
    throw new Error('API returned HTML — backend may be unreachable');
  }
  const json = await res.json();
  return json;
}

export async function getMasterData(type) {
  const url = type
    ? `/api/master-data?type=${encodeURIComponent(type)}`
    : `/api/master-data`;
  const json = await safeFetch(url);
  if (!json.success) throw new Error(json.error || 'Failed to fetch master data');
  return json.data;
}

export async function createMasterData({ type, label }) {
  const json = await safeFetch('/api/master-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, label }),
  });
  if (!json.success) throw new Error(json.error || 'Failed to create master data');
  return json.data;
}
