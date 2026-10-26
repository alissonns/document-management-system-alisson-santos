const apiBase = '/api';

async function readError(response) {
  try {
    const payload = await response.json();
    return payload.error || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

export async function listDocuments(owner) {
  const response = await fetch(`${apiBase}/documents`, {
    headers: { 'X-User-Id': owner },
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function uploadDocument(owner, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${apiBase}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: formData,
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function downloadDocument(owner, id) {
  const response = await fetch(`${apiBase}/documents/${encodeURIComponent(id)}/download`, {
    headers: { 'X-User-Id': owner },
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.blob();
}