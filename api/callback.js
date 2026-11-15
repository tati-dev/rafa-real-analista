// Recebe o código do TikTok, troca por token e mostra o relatório da conta.
// Variáveis de ambiente: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, PUBLIC_BASE_URL
// Opcional (só durante o setup): SHOW_REFRESH=1 mostra o refresh token uma vez.

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function page(res, status, corpo) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Apaga o cookie de state depois de usar
  res.setHeader('Set-Cookie', 'tt_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  res.status(status).send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rafa Real Analista</title>
<style>
body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#111;line-height:1.5}
table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left;font-size:14px}
.aviso{background:#fff4e5;border:1px solid #f0b35a;padding:10px;border-radius:6px;font-size:14px}
code{word-break:break-all}
</style></head><body>${corpo}</body></html>`);
}

module.exports = async (req, res) => {
  const { code, state, error } = req.query;
  const cookie = req.headers.cookie || '';
  const esperado = (cookie.match(/tt_state=([a-f0-9]+)/) || [])[1];

  if (error) return page(res, 400, `<p>Autorização negada: ${esc(error)}</p>`);
  if (!code || !esperado || state !== esperado) {
    return page(res, 400, '<p>Requisição inválida. Tente entrar de novo pela página inicial.</p>');
  }

  // 1) Troca o código pelo token
  const tokenResp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.PUBLIC_BASE_URL}/api/callback`,
    }),
  });
  const tok = await tokenResp.json();
  if (!tok.access_token) {
    return page(res, 500, `<p>Falha ao obter o token.</p><pre>${esc(JSON.stringify(tok, null, 2))}</pre>`);
  }

  const h = { Authorization: `Bearer ${tok.access_token}` };

  // 2) Dados do perfil (estatísticas)
  const userResp = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,follower_count,following_count,likes_count,video_count',
    { headers: h }
  );
  const user = (await userResp.json())?.data?.user || {};

  // 3) Lista de vídeos recentes com métricas
  const vidResp = await fetch(
    'https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,view_count,like_count,comment_count,share_count',
    {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_count: 20 }),
    }
  );
  const videos = (await vidResp.json())?.data?.videos || [];

  const linhas = videos
    .map((v) => {
      const data = v.create_time ? new Date(v.create_time * 1000).toLocaleDateString('pt-BR') : '';
      return `<tr><td>${esc(data)}</td><td>${esc(v.view_count)}</td><td>${esc(v.like_count)}</td><td>${esc(v.comment_count)}</td><td>${esc(v.share_count)}</td></tr>`;
    })
    .join('');

  const aviso =
    process.env.SHOW_REFRESH === '1'
      ? `<div class="aviso"><p><strong>Refresh token (copie agora e guarde no cofre):</strong></p>
         <p><code>${esc(tok.refresh_token)}</code></p>
         <p>Depois do setup, remova SHOW_REFRESH das variáveis de ambiente.</p></div>`
      : '';

  page(
    res,
    200,
    `<h1>Relatório — ${esc(user.display_name || user.username || '')}</h1>
     <table>
       <tr><th>Seguidores</th><td>${esc(user.follower_count)}</td></tr>
       <tr><th>Seguindo</th><td>${esc(user.following_count)}</td></tr>
       <tr><th>Curtidas totais</th><td>${esc(user.likes_count)}</td></tr>
       <tr><th>Vídeos publicados</th><td>${esc(user.video_count)}</td></tr>
     </table>
     <h2>Últimos vídeos</h2>
     <table><tr><th>Data</th><th>Views</th><th>Curtidas</th><th>Comentários</th><th>Compartilhamentos</th></tr>${linhas || '<tr><td colspan="5">Nenhum vídeo retornado.</td></tr>'}</table>
     <p class="aviso">Retenção e impressões do FYP não estão disponíveis pela API. Use o TikTok Studio para esses dados.</p>
     ${aviso}
     <p><a href="/">Voltar</a></p>`
  );
};
