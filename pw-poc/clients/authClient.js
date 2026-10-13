// Auth endpoints. Methods that need a session take the bearer token explicitly (the `auth` fixture is built on the
// anonymous context); omit the token to exercise the "no token" behavior.
const bearer = (token) => (token ? { Authorization: `Bearer ${token}` } : undefined);

class AuthClient {
  constructor(request) {
    this.request = request;
  }

  login(data) {
    return this.request.post('/auth/api/login', { data });
  }

  // Sends the body byte-for-byte (for malformed-JSON tests). A Buffer is required: Playwright would otherwise
  // JSON-encode a plain string, and the server would receive a valid JSON string instead of malformed JSON.
  loginRaw(rawBody) {
    return this.request.post('/auth/api/login', { data: Buffer.from(rawBody), headers: { 'Content-Type': 'application/json' } });
  }

  logout(token) {
    return this.request.post('/auth/api/logout', { data: {}, headers: bearer(token) });
  }

  me(token) {
    return this.request.get('/auth/api/me', { headers: bearer(token) });
  }

  refresh(token) {
    return this.request.post('/auth/api/refresh', { data: {}, headers: bearer(token) });
  }

  providers() {
    return this.request.get('/auth/api/providers');
  }

  users(token) {
    return this.request.get('/auth/api/users', { headers: bearer(token) });
  }

  updateRole(id, data, token) {
    return this.request.put(`/auth/api/users/${id}/role`, { data, headers: bearer(token) });
  }

  setActive(id, data, token) {
    return this.request.put(`/auth/api/users/${id}/active`, { data, headers: bearer(token) });
  }

  deleteUser(id, token) {
    return this.request.delete(`/auth/api/users/${id}`, { headers: bearer(token) });
  }
}

module.exports = { AuthClient };
