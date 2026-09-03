const crypto = require('crypto');

const SESSION_TTL_SECONDS = 5 * 60;
const COOKIE_NAME = 'portfolio_editor_session';

function getSecret() {
  return process.env.SESSION_SECRET;
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function getClientIp(request) {
  const forwardedIp = request.headers['x-real-ip'] || request.headers['x-forwarded-for'];
  return String(forwardedIp || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function hashClientIp(ip) {
  return crypto.createHash('sha256').update(`${getSecret()}:${ip}`).digest('base64url');
}

function createSession(request) {
  const payload = encode(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString('hex'),
    ipHash: hashClientIp(getClientIp(request))
  }));
  return `${payload}.${sign(payload)}`;
}

function hasValidSession(request) {
  const cookieHeader = request.headers.cookie || '';
  const sessionCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!sessionCookie || !getSecret()) return false;

  try {
    const value = decodeURIComponent(sessionCookie.slice(COOKIE_NAME.length + 1));
    const [payload, signature] = value.split('.');
    if (!payload || !signature) return false;

    const expectedSignature = sign(payload);
    if (signature.length !== expectedSignature.length) return false;
    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!signaturesMatch) return false;

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const currentIpHash = hashClientIp(getClientIp(request));
    if (session.ipHash.length !== currentIpHash.length) return false;
    return session.exp > Math.floor(Date.now() / 1000)
      && crypto.timingSafeEqual(Buffer.from(session.ipHash), Buffer.from(currentIpHash));
  } catch (error) {
    return false;
  }
}

function setSessionCookie(response, value, maxAge = SESSION_TTL_SECONDS) {
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`);
}

module.exports = (request, response) => {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    return response.status(200).json({ authenticated: hasValidSession(request) });
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  if (request.body?.action === 'logout') {
    setSessionCookie(response, '', 0);
    return response.status(200).json({ authenticated: false });
  }

  const username = String(request.body?.username || '');
  const password = String(request.body?.password || '');
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredUsername || !configuredPassword || username !== configuredUsername || password !== configuredPassword) {
    return response.status(401).json({ error: 'Login details did not match.' });
  }

  setSessionCookie(response, createSession(request));
  return response.status(200).json({ authenticated: true });
};
