// Simple HTTP Basic Auth to keep /admin from being wide open.
// Credentials come from environment variables — set these in your host's
// dashboard (Render/Railway/etc), never hardcode them.
module.exports = function adminAuth(req, res, next) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  // If no credentials are configured, don't lock the developer out during
  // local setup — but this should always be set in production.
  if (!user || !pass) {
    console.warn('[warn] ADMIN_USER/ADMIN_PASSWORD not set — /admin is unprotected.');
    return next();
  }

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPass = decoded.slice(separatorIndex + 1);

    if (suppliedUser === user && suppliedPass === pass) {
      return next();
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Authentication required.');
};
