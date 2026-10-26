# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, armazenados no filesystem local, com metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos do usuário informado na requisição.
- Download de documentos pelo identificador, respeitando o dono.
- Interface web para upload, listagem e download.
- Armazenamento local dos arquivos e metadados em memória.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Versionamento de documentos.
- Autenticação, cadastro e persistência de usuários.
- Persistência de metadados após reiniciar o backend.
- Compartilhamento entre usuários.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo por requisição usando `multipart/form-data`, no campo `file`. |
| RF-02 | O envio e as consultas exigem o cabeçalho `X-User-Id`, usado como identificador do dono. |
| RF-03 | O sistema gera identificador único e nome interno para o arquivo; o nome original é mantido apenas como metadado. |
| RF-04 | O usuário pode listar somente documentos cujo dono corresponda ao `X-User-Id` enviado. |
| RF-05 | O usuário pode baixar um documento pelo identificador somente se ele pertencer ao mesmo usuário. Documento inexistente ou de outro usuário retorna `404`. |
| RF-06 | A interface permite selecionar e enviar um arquivo, visualizar documentos, atualizar a listagem e baixar arquivos. |
| RF-07 | A interface informa estados de carregamento, sucesso e erro nas operações. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos são gravados localmente com `multer` e `diskStorage`, por padrão em `backend/storage`. |
| RNF-02 | Metadados ficam em memória e são perdidos quando o processo backend reinicia. |
| RNF-03 | Porta, diretório e limite de upload são configuráveis por `PORT`, `STORAGE_DIR` e `MAX_FILE_SIZE_BYTES`. |
| RNF-04 | O limite padrão de upload é 10 MiB; excedê-lo retorna HTTP `413`. |
| RNF-05 | O backend mantém fluxo `routes -> controllers -> services -> repositories`. |
| RNF-06 | O frontend usa `fetch` com prefixo `/api`; o proxy do Vite remove o prefixo e encaminha ao backend local. |
| RNF-07 | Respostas de erro da API usam JSON com a propriedade `error`; downloads retornam conteúdo binário. |

## 5. Modelo de dados

Metadados mantidos no repositório em memória:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador UUID do documento. |
| `originalName` | string | Nome original do arquivo para exibição e download. |
| `size` | number | Tamanho em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601. |
| `owner` | string | Identificador recebido em `X-User-Id`. |
| `storageName` | string | Nome UUID interno usado para localizar o arquivo; não é exposto pela API. |

## 6. Contratos de API

Os endpoints abaixo são expostos pelo backend sem `/api`; no navegador o proxy Vite recebe `/api` e o remove. Todas as operações exigem `X-User-Id`.

### POST `/upload` (cliente: `/api/upload`)

- Entrada: `multipart/form-data`, campo `file` com um arquivo.
- Sucesso: `201 Created`, metadados públicos (`id`, `originalName`, `size`, `uploadedAt`, `owner`).
- Erros: `400` para usuário ou arquivo ausente/inválido; `413` quando excede o limite; `500` em falha interna.

### GET `/documents` (cliente: `/api/documents`)

- Saída: `200 OK`, array de metadados públicos do usuário; array vazio quando não há documentos.
- Erros: `400` para usuário ausente/inválido; `500` em falha interna.

### GET `/documents/:id/download` (cliente: `/api/documents/:id/download`)

- Saída: `200 OK`, arquivo binário com nome original no cabeçalho de download.
- Erros: `400` para usuário ausente/inválido; `404` para documento inexistente, de outro usuário ou arquivo indisponível; `500` em outra falha de leitura.

Formato de erro: `{ "error": "mensagem" }`.

## 7. Decisões arquiteturais e limitações

- `routes` configura endpoints e o middleware Multer; `controllers` valida a entrada HTTP e produz respostas; `services` concentra as regras; `repositories` mantém metadados e resolve os caminhos dos arquivos locais.
- O frontend é React, organizado em componentes e serviço de API.
- `X-User-Id` é uma identidade de demonstração, não um mecanismo de autenticação; pode ser falsificada e não deve ser tratado como segurança de produção.
- Metadados são voláteis. Arquivos podem permanecer no disco sem referência após reinício; esta versão não realiza limpeza automática.

## 8. Plano de execução

1. **Definir configurações e contratos:** estabelecer variáveis de ambiente, formato de erro, limite e regras de ownership. Aceite: contratos e validações documentados.
2. **Implementar persistência local e regras:** criar configuração, repository e service para salvar arquivos em disco e metadados em memória. Aceite: nomes internos gerados e consultas filtradas pelo dono.
3. **Expor a API:** implementar controllers, routes e integração em `backend/src/app.js`. Aceite: upload, listagem, download e erros atendem aos contratos; testes cobrem sucesso e validações.
4. **Construir a interface:** criar serviço de API e componentes React em `frontend/src/`. Aceite: usuário consegue enviar, listar, atualizar e baixar documentos, com feedback de estado e erro.
5. **Validar e documentar:** executar `npm test` no backend e `npm run build` no frontend; registrar execução e configuração no README. Aceite: testes e build passam e as instruções permitem iniciar a aplicação localmente.