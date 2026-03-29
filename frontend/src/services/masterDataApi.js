const BASE = '';

export async function getMasterData(type) {
  const url = type ? `${BASE}/api/master-data?type=${encodeURIComponent(type)}` : `${BASE}/api/master-data`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch master data');
  return json.data;
}

export async function createMasterData({ type, label }) {
  const res = await fetch(`${BASE}/api/master-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, label }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create master data');
  return json.data;
}
