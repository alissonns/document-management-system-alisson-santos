const crypto = require('node:crypto');
const fs = require('node:fs');
const multer = require('multer');
const { maxFileSize, storageDirectory } = require('../config');
const documentController = require('../controllers/documentController');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename: (req, file, callback) => {
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({ storage, limits: { fileSize: maxFileSize } });
const router = require('express').Router();

router.post('/upload', documentController.requireOwner, upload.single('file'), documentController.upload);
router.get('/documents', documentController.requireOwner, documentController.list);
router.get('/documents/:id/download', documentController.requireOwner, documentController.download);

module.exports = router;