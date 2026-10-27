const path = require('node:path');
const { access } = require('node:fs/promises');
const { storageDirectory } = require('../config');

const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return { ...document };
}

function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .map((document) => ({ ...document }));
}

function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

function getStoragePath(storageName) {
  return path.join(storageDirectory, storageName);
}

async function getAvailableStoragePath(storageName) {
  const filePath = getStoragePath(storageName);
  try {
    await access(filePath);
    return filePath;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

module.exports = { findById, findByOwner, getAvailableStoragePath, save };