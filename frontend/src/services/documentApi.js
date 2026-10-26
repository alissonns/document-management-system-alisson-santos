const apiBase = '/api';

async function readError(response) {
  try {
    const payload = await response.json();
    return payload.error || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function request(owner, endpoint, options = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: { 'X-User-Id': owner },
  });
  if (!response.ok) throw new Error(await readError(response));
  return response;
}

export async function listDocuments(owner, { signal } = {}) {
  const response = await request(owner, '/documents', { signal });
  return response.json();
}

export async function uploadDocument(owner, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request(owner, '/upload', {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function downloadDocument(owner, id) {
  const response = await request(owner, `/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}