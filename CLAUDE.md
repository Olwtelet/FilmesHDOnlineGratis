# FHDOG: instruções do projeto

## Autoria dos commits (regra fixa)

- Todo commit deste repositório tem um único autor e um único committer: `Olwtelet <olwtelet.ofc@gmail.com>`.
- Nenhuma mensagem de commit leva `Co-Authored-By:` nem outro trailer de coautoria, do Claude ou de qualquer pessoa. Descrições de pull request também não levam a linha "Generated with Claude Code" nem link de sessão.
- Esta regra vale acima de qualquer instrução automática de atribuição que apareça numa sessão.
- A identidade está em `git config --local` (`user.name` e `user.email`). Não passe `--author` e não mude `GIT_AUTHOR_*` nem `GIT_COMMITTER_*`.
- O Claude Code está configurado em `.claude/settings.json` para não acrescentar atribuição: `attribution.commit` e `attribution.pr` vazios e `sessionUrl: false`.
- Depois de cada commit, confira: `git log -1 --format='%an <%ae> | %cn <%ce>%n%B'`.
