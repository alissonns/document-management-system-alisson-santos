const documentService = require('../services/documentService');

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) {
    return res.status(400).json({ error: 'O cabeçalho X-User-Id é obrigatório.' });
  }

  req.owner = owner;
  return next();
}

async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Envie um arquivo no campo file.' });
  }

  const document = await documentService.createDocument(req.file, req.owner);
  const { storageName, ...publicDocument } = document;
  return res.status(201).json(publicDocument);
}

function list(req, res) {
  return res.json(documentService.listDocuments(req.owner));
}

async function download(req, res, next) {
  const result = await documentService.getDownload(req.owner, req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  return res.download(result.filePath, result.document.originalName, (error) => {
    if (error) next(error);
  });
}

module.exports = { download, list, requireOwner, upload };