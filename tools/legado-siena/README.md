# Ferramentas antigas: não rodar

Estes scripts são da réplica da Siena e ficam só como registro de como a estrutura foi extraída e comparada:

- `sync-assets.mjs` e `import-*.mjs` baixam de novo as marcas, os filmes e os vídeos retirados e reescrevem os dados do site a partir do HTML guardado em `reference/`. Rodar qualquer um deles destrói o conteúdo atual.
- `compare.mjs`, `dom-diff.mjs`, `check-site.mjs`, `check-keyboard.mjs`, `theme-*`, `scenario.mjs`, `scenarios/` e `lib/runner.mjs` comparavam a réplica com o site ao vivo, com as rotas e os filmes antigos.
- `assets-report.mjs`, `extract.mjs`, `serve-reference.mjs` e `sbs.mjs` dependem de `assets-manifest.json`, que foi para `reference/retirados-fase2/inventario/`.

Os caminhos relativos já não valem nesta pasta, e nada no projeto depende deles. Os testes atuais estão em `tools/testes/`.
