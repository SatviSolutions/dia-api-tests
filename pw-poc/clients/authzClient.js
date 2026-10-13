// Authorization engine API (/api/authz). Tests only read, or send requests that are rejected before anything is stored
// (an empty body, a non-existent id, or no token). They never create a grant/policy/request and never change a role switch,
// so the shared permission posture cannot change.
class AuthzClient {
  constructor(request) {
    this.request = request;
  }

  myPermissions() {
    return this.request.get('/api/authz/my-permissions');
  }

  roles() {
    return this.request.get('/api/authz/roles');
  }

  catalog() {
    return this.request.get('/api/authz/catalog');
  }

  grants() {
    return this.request.get('/api/authz/grants');
  }

  createGrant(data) { // tests only send an invalid body
    return this.request.post('/api/authz/grants', { data });
  }

  deleteGrant(id) { // tests only use a non-existent id
    return this.request.delete(`/api/authz/grants/${id}`);
  }

  policies() {
    return this.request.get('/api/authz/policies');
  }

  createPolicy(data) { // tests only send an invalid body
    return this.request.post('/api/authz/policies', { data });
  }

  deletePolicy(id) { // tests only use a non-existent id
    return this.request.delete(`/api/authz/policies/${id}`);
  }

  classifications() {
    return this.request.get('/api/authz/classifications');
  }

  myRequests() {
    return this.request.get('/api/authz/requests/mine');
  }

  createRequest(data) { // tests only send an invalid body
    return this.request.post('/api/authz/requests', { data });
  }

  accessReport() {
    return this.request.get('/api/authz/access-report');
  }

  whyNot(params) {
    return this.request.get('/api/authz/why-not', { params });
  }

  explain(params) {
    return this.request.get('/api/authz/explain', { params });
  }

  updateRoleSwitches(role, data) { // tests only send an invalid body for a non-existent role
    return this.request.put(`/api/authz/roles/${role}/switches`, { data });
  }
}

module.exports = { AuthzClient };
