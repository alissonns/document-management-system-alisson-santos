const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/document.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(documentRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = status === 413
      ? 'O arquivo excede o limite permitido.'
      : 'Não foi possível processar o arquivo enviado.';
    return res.status(status).json({ error: message });
  }

  if (error.code === 'ENOENT') {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Ocorreu um erro interno.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
