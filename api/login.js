// Inicia o login com TikTok (Login Kit).
// Variáveis de ambiente: TIKTOK_CLIENT_KEY, PUBLIC_BASE_URL
const crypto = require('crypto');

module.exports = (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');

  // Cookie de 10 minutos para validar o retorno (proteção contra CSRF)
  res.setHeader(
    'Set-Cookie',
    `tt_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    scope: 'user.info.basic,user.info.profile,user.info.stats,video.list',
    response_type: 'code',
    redirect_uri: `${process.env.PUBLIC_BASE_URL}/api/callback`,
    state,
  });

  res.writeHead(302, { Location: `https://www.tiktok.com/v2/auth/authorize/?${params}` });
  res.end();
};
