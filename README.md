# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey alissonns!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/alissonns/document-management-system-alisson-santos/issues/1)

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

## Executar localmente

O backend usa Node.js e grava os arquivos em `backend/storage`. Os metadados
ficam em memória e são perdidos quando o processo é reiniciado.

```sh
cd backend
npm install
npm run dev
```

Em outro terminal, inicie a interface:

```sh
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. Escolha um identificador no campo **Usuário**;
ele é enviado como `X-User-Id` e salvo no navegador. Essa identificação é para
demonstração e não substitui autenticação.

O backend aceita `PORT` (padrão `3000`), `STORAGE_DIR` (padrão
`backend/storage`) e `MAX_FILE_SIZE_BYTES` (padrão `10485760`, ou 10 MiB).
O proxy do Vite encaminha chamadas `/api` ao backend local.

Para executar os testes backend:

```sh
cd backend
npm test
```

