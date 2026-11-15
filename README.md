# Rafa Real Analista — versão web (Vercel)

Esta versão tem a página de login e o relatório. Ela serve para o setup e para a gravação de demonstração do fluxo.

## Estrutura

- `index.html`: página inicial com o botão Entrar com TikTok.
- `api/login.js`: redireciona para a autorização do TikTok.
- `api/callback.js`: troca o código por token e mostra o relatório.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Nome | Valor |
|---|---|
| `TIKTOK_CLIENT_KEY` | Client Key do app (portal de desenvolvedores) |
| `TIKTOK_CLIENT_SECRET` | Client Secret do app. Não coloque no código. |
| `PUBLIC_BASE_URL` | Endereço do projeto, sem barra no final. Ex.: `https://rafa-real-analista.vercel.app` |
| `SHOW_REFRESH` | Opcional. Use `1` só durante o setup, para ver o refresh token uma vez. Depois apague. |

## Antes de testar

1. No portal do TikTok, em Login Kit, cadastre a Redirect URI: `PUBLIC_BASE_URL` + `/api/callback`.
2. Confirme que o app pede os escopos `user.info.basic`, `user.info.profile`, `user.info.stats` e `video.list`.
3. Se o app estiver em sandbox, adicione a conta @sourafa.real como usuário de teste.

## Publicar

1. Crie um projeto na Vercel e importe esta pasta.
2. Configure as variáveis acima.
3. Faça o deploy e abra `PUBLIC_BASE_URL`.

## Testar

1. Clique em Entrar com TikTok, logada na conta @sourafa.real.
2. Aprove os escopos.
3. Deve aparecer o relatório com as estatísticas e os vídeos.
4. Se SHOW_REFRESH=1 estiver ativo, copie o refresh token e guarde no cofre. Depois apague a variável.

## Observações

- O script `analista.py` (pasta separada) é o que roda todo dia. Esta versão web é para autorizar a conta e mostrar o fluxo.
- O estado de login é validado por cookie. Se o retorno der erro de requisição inválida, tente entrar de novo pela página inicial.
- Não guarde o Client Secret nem o refresh token em arquivos do projeto ou em conversas.
