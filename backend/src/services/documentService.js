const { randomUUID } = require('node:crypto');
const { access } = require('node:fs/promises');
const documentRepository = require('../repositories/documentRepository');

async function createDocument(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
  };

  return documentRepository.save(document);
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner);
}

async function getDownload(owner, id) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) return null;

  const filePath = documentRepository.getStoragePath(document.storageName);
  try {
    await access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }

  return { document, filePath };
}

module.exports = { createDocument, getDownload, listDocuments };