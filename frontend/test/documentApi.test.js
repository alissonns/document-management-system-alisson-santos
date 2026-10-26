import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadDocument, listDocuments, uploadDocument } from '../src/services/documentApi.js';

afterEach(() => mock.restoreAll());

test('lista documentos via /api com usuário e sinal de cancelamento', async () => {
  const documents = [{ id: 'documento-1', originalName: 'relatorio.txt' }];
  const controller = new AbortController();
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json(documents));

  assert.deepEqual(await listDocuments('usuario-1', { signal: controller.signal }), documents);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/documents');
  assert.deepEqual(options.headers, { 'X-User-Id': 'usuario-1' });
  assert.equal(options.signal, controller.signal);
});

test('envia arquivo multipart sem sobrescrever o Content-Type do navegador', async () => {
  const document = { id: 'documento-1', originalName: 'relatorio.txt' };
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json(document, { status: 201 }));

  assert.deepEqual(await uploadDocument('usuario-1', new Blob(['conteúdo'])), document);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/upload');
  assert.equal(options.method, 'POST');
  assert.deepEqual(options.headers, { 'X-User-Id': 'usuario-1' });
  assert.ok(options.body instanceof FormData);
  assert.equal(await options.body.get('file').text(), 'conteúdo');
});

test('baixa conteúdo binário e codifica o identificador na URL', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(new Uint8Array([0, 128, 255])));

  const blob = await downloadDocument('usuario-1', 'pasta/arquivo');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), new Uint8Array([0, 128, 255]));
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/documents/pasta%2Farquivo/download');
  assert.deepEqual(options.headers, { 'X-User-Id': 'usuario-1' });
});

test('propaga mensagens de erro da API nas três operações', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Acesso indisponível.' }, { status: 500 }));

  await assert.rejects(listDocuments('usuario-1'), { message: 'Acesso indisponível.' });
  await assert.rejects(uploadDocument('usuario-1', new Blob(['arquivo'])), { message: 'Acesso indisponível.' });
  await assert.rejects(downloadDocument('usuario-1', 'documento-1'), { message: 'Acesso indisponível.' });
});

test('usa mensagem padrão quando o erro não contém JSON válido', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('Bad Gateway', { status: 502 }));

  await assert.rejects(listDocuments('usuario-1'), { message: 'Não foi possível concluir a solicitação.' });
});

test('preserva cancelamento da consulta sem convertê-lo em outro erro', async () => {
  const controller = new AbortController();
  controller.abort();
  mock.method(globalThis, 'fetch', async (url, { signal }) => {
    signal.throwIfAborted();
  });

  await assert.rejects(listDocuments('usuario-1', { signal: controller.signal }), { name: 'AbortError' });
});