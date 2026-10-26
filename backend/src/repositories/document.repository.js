const path = require('node:path');
const { storageDirectory } = require('../config');

const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return { ...document };
}

function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .map(({ storageName, ...document }) => ({ ...document }));
}

function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

function getStoragePath(storageName) {
  return path.join(storageDirectory, storageName);
}

module.exports = { findById, findByOwner, getStoragePath, save };