const path = require('node:path');

const defaultStorageDirectory = path.join(__dirname, '..', 'storage');
const storageDirectory = path.resolve(process.env.STORAGE_DIR || defaultStorageDirectory);
const configuredMaxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);
const maxFileSize = Number.isFinite(configuredMaxFileSize) && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : 10 * 1024 * 1024;

module.exports = { maxFileSize, storageDirectory };