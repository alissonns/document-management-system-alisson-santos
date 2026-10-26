import { DownloadButton } from './DownloadButton.jsx';

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function DocumentList({ documents, owner, isLoading, error, onRetry }) {
  if (isLoading) {
    return <div className="list-message" role="status">Carregando documentos...</div>;
  }

  if (error) {
    return (
      <div className="list-message list-error" role="alert">
        <span>{error}</span>
        <button type="button" className="text-button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-index" aria-hidden="true">00</span>
        <div>
          <h3>Nenhum documento por aqui</h3>
          <p>Os arquivos enviados aparecerão nesta lista.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="list-labels" aria-hidden="true">
        <span>Nome</span>
        <span>Enviado em</span>
        <span>Tamanho</span>
        <span />
      </div>
      {documents.map((document) => (
        <article className="document-row" key={document.id}>
          <div className="document-name">
            <span className="file-mark" aria-hidden="true">DOC</span>
            <span title={document.originalName}>{document.originalName}</span>
          </div>
          <time dateTime={document.uploadedAt}>{formatDate(document.uploadedAt)}</time>
          <span className="document-size">{formatSize(document.size)}</span>
          <DownloadButton document={document} owner={owner} />
        </article>
      ))}
    </div>
  );
}