const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/document.repository');

function toPublicDocument({ storageName, ...document }) {
  return document;
}

async function createDocument(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
  };

  return toPublicDocument(documentRepository.save(document));
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner).map(toPublicDocument);
}

async function getDownload(owner, id) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) return null;

  const filePath = await documentRepository.getAvailableStoragePath(document.storageName);
  if (!filePath) return null;

  return { document: toPublicDocument(document), filePath };
}

module.exports = { createDocument, getDownload, listDocuments };