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

function uploadForm(name, contents) {
  const form = new FormData();
  form.append('file', new Blob([contents]), name);
  return form;
}

after(() => {
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

test('faz upload, lista e baixa um documento apenas para seu dono', async () => {
  const { server, baseUrl } = await startServer();
  const owner = `user-${randomUUID()}`;
  try {
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': owner },
      body: uploadForm('relatorio.txt', 'conteúdo do documento'),
    });

    assert.equal(uploadResponse.status, 201);
    const document = await uploadResponse.json();
    assert.equal(document.originalName, 'relatorio.txt');
    assert.equal(document.owner, owner);
    assert.equal(document.size, Buffer.byteLength('conteúdo do documento'));
    assert.ok(document.id);
    assert.ok(document.uploadedAt);
    assert.equal('storageName' in document, false);

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': owner },
    });
    assert.deepEqual(await listResponse.json(), [document]);

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': owner },
    });
    assert.equal(downloadResponse.status, 200);
    assert.equal(await downloadResponse.text(), 'conteúdo do documento');
    assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);

    const otherOwner = `user-${randomUUID()}`;
    const otherList = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': otherOwner },
    });
    assert.deepEqual(await otherList.json(), []);

    const unauthorizedDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': otherOwner },
    });
    assert.equal(unauthorizedDownload.status, 404);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('rejeita usuário ausente, arquivo ausente e arquivo acima do limite', async () => {
  const { server, baseUrl } = await startServer();
  try {
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
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
