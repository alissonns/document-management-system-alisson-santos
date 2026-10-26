import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export function UploadComponent({ owner, onUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file) {
      setIsError(true);
      setMessage('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setMessage('');
    try {
      await uploadDocument(owner, file);
      setFile(null);
      form.reset();
      setIsError(false);
      setMessage('Documento enviado.');
      onUploaded();
    } catch (error) {
      setIsError(true);
      setMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-panel" onSubmit={handleSubmit}>
      <div className="upload-copy">
        <span className="upload-mark" aria-hidden="true">+</span>
        <div>
          <h2>Adicionar documento</h2>
          <p>Escolha um arquivo para guardar no seu espaço.</p>
        </div>
      </div>
      <div className="upload-actions">
        <label className="file-picker" htmlFor="document-file">
          <span>{file ? file.name : 'Selecionar arquivo'}</span>
          <input
            id="document-file"
            type="file"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setMessage('');
            }}
          />
        </label>
        <button type="submit" className="primary-button" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        </button>
      </div>
      <p className="upload-feedback" aria-live="polite" data-error={isError}>
        {message || 'Tamanho máximo: 10 MiB'}
      </p>
    </form>
  );
}