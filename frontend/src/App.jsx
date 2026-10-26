import { useEffect, useState } from 'react';
import { DocumentList } from './components/DocumentList.jsx';
import { UploadComponent } from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

function getSavedOwner() {
  return localStorage.getItem('dms-user-id') || 'usuario-demo';
}

export default function App() {
  const [owner, setOwner] = useState(getSavedOwner);
  const [ownerInput, setOwnerInput] = useState(owner);
  const [ownerError, setOwnerError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setLoadError('');

    listDocuments(owner)
      .then((items) => {
        if (isCurrent) setDocuments(items);
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [owner, refreshKey]);

  function saveOwner(event) {
    event.preventDefault();
    const nextOwner = ownerInput.trim();
    if (!nextOwner) {
      setOwnerError('Informe um identificador de usuário.');
      return;
    }

    localStorage.setItem('dms-user-id', nextOwner);
    setOwner(nextOwner);
    setOwnerInput(nextOwner);
    setOwnerError('');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Dossiê, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>Dossiê<span className="brand-period">.</span></span>
        </a>
        <form className="identity-form" onSubmit={saveOwner}>
          <label htmlFor="user-id">Usuário</label>
          <input
            id="user-id"
            value={ownerInput}
            onChange={(event) => setOwnerInput(event.target.value)}
            aria-describedby={ownerError ? 'owner-error' : undefined}
          />
          <button type="submit" className="identity-save">Aplicar</button>
          {ownerError && <span id="owner-error" className="field-error">{ownerError}</span>}
        </form>
      </header>

      <section className="workspace" aria-labelledby="page-title">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ARQUIVO PESSOAL</p>
            <h1 id="page-title">Seus documentos</h1>
            <p className="page-description">Arquivos enviados por <strong>{owner}</strong></p>
          </div>
          <div className="document-count" aria-live="polite">
            <span>{isLoading ? '...' : documents.length.toString().padStart(2, '0')}</span>
            <small>{documents.length === 1 ? 'documento' : 'documentos'}</small>
          </div>
        </div>

        <UploadComponent
          owner={owner}
          onUploaded={() => setRefreshKey((current) => current + 1)}
        />

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading">
            <h2 id="documents-title">Biblioteca</h2>
            <button
              type="button"
              className="text-button"
              onClick={() => setRefreshKey((current) => current + 1)}
              disabled={isLoading}
            >
              Atualizar lista
            </button>
          </div>
          <DocumentList
            documents={documents}
            owner={owner}
            isLoading={isLoading}
            error={loadError}
            onRetry={() => setRefreshKey((current) => current + 1)}
          />
        </section>
      </section>

      <footer className="app-footer">
        <span>Documentos armazenados localmente</span>
        <span className="footer-status"><span aria-hidden="true" /> Conectado</span>
      </footer>
    </main>
  );
}
