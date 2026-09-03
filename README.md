# Portfolio

## Editor authentication

The editor login uses the Vercel function at `/api/auth`. Configure these environment variables in Vercel before deploying:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET` (a long random value used to sign session cookies)

The password is checked only by the server. The browser receives an HttpOnly, Secure, SameSite session cookie and never stores the password or a client-side authentication flag.

Each five-minute session is also bound to a keyed hash of the IP address reported by Vercel. The raw IP address is not stored in the cookie; a session copied to another IP address is rejected.
