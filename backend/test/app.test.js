const { after, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '128';

const app = require('../src/app');

async function startServer() {
  const server = app.listen(0);
  await once(server, 'listening');
  return {
    server,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  };
}

async function withServer(run) {
  const { server, baseUrl } = await startServer();
  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

function uploadForm(name, contents) {
  const form = new FormData();
  form.append('file', new Blob([contents]), name);
  return form;
}

function uploadDocument(baseUrl, owner, name, contents) {
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: uploadForm(name, contents),
  });
}

after(() => {
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

test('faz upload de documento e retorna apenas metadados públicos', async () => {
  const owner = `user-${randomUUID()}`;
  await withServer(async (baseUrl) => {
    const uploadResponse = await uploadDocument(baseUrl, owner, 'relatorio.txt', 'conteúdo do documento');
    assert.equal(uploadResponse.status, 201);
    const document = await uploadResponse.json();
    assert.equal(document.originalName, 'relatorio.txt');
    assert.equal(document.owner, owner);
    assert.equal(document.size, Buffer.byteLength('conteúdo do documento'));
    assert.ok(document.id);
    assert.ok(document.uploadedAt);
    assert.equal('storageName' in document, false);
  });
});

test('lista somente documentos do usuário informado', async () => {
  const owner = `user-${randomUUID()}`;
  const otherOwner = `user-${randomUUID()}`;
  await withServer(async (baseUrl) => {
    const firstUpload = await uploadDocument(baseUrl, owner, 'primeiro.txt', 'primeiro');
    const secondUpload = await uploadDocument(baseUrl, owner, 'segundo.txt', 'segundo');
    const otherUpload = await uploadDocument(baseUrl, otherOwner, 'outro.txt', 'outro');
    const firstDocument = await firstUpload.json();
    const secondDocument = await secondUpload.json();
    assert.equal(secondUpload.status, 201);
    assert.equal(otherUpload.status, 201);

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': owner },
    });
    assert.equal(listResponse.status, 200);
    assert.deepEqual(await listResponse.json(), [firstDocument, secondDocument]);

    const otherListResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': `user-${randomUUID()}` },
    });
    assert.deepEqual(await otherListResponse.json(), []);
  });
});

test('baixa documento do próprio usuário e oculta documento de outro usuário', async () => {
  const owner = `user-${randomUUID()}`;
  await withServer(async (baseUrl) => {
    const uploadResponse = await uploadDocument(baseUrl, owner, 'relatorio.txt', 'conteúdo do documento');
    assert.equal(uploadResponse.status, 201);
    const document = await uploadResponse.json();

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': owner },
    });
    assert.equal(downloadResponse.status, 200);
    assert.equal(await downloadResponse.text(), 'conteúdo do documento');
    assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);

    const unauthorizedDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': `user-${randomUUID()}` },
    });
    assert.equal(unauthorizedDownload.status, 404);
  });
});

test('rejeita usuário ausente, arquivo ausente e arquivo acima do limite', async () => {
  await withServer(async (baseUrl) => {
    const missingOwner = await fetch(`${baseUrl}/documents`);
    assert.equal(missingOwner.status, 400);

    const missingFile = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': `user-${randomUUID()}` },
      body: new FormData(),
    });
    assert.equal(missingFile.status, 400);

    const oversized = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': `user-${randomUUID()}` },
      body: uploadForm('grande.txt', 'x'.repeat(256)),
    });
    assert.equal(oversized.status, 413);
  });
});
