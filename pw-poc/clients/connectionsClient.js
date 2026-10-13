// Connection endpoints. Tests only ever send these write calls with invalid bodies, non-existent ids or no file part,
// so nothing can be created, changed, deleted or uploaded in the shared environment.
class ConnectionsClient {
  constructor(request) {
    this.request = request;
  }

  list() {
    return this.request.get('/api/repo/connections');
  }

  get(id) {
    return this.request.get(`/api/repo/connections/${id}`);
  }

  audit(id) {
    return this.request.get(`/api/repo/connections/${id}/audit`);
  }

  sidebar() {
    return this.request.get('/api/repo/connections/sidebar');
  }

  search(q) {
    return this.request.get('/api/repo/connections/search', { params: { q } });
  }

  update(id, data) {
    return this.request.put(`/api/repo/connections/${id}`, { data });
  }

  delete(id) {
    return this.request.delete(`/api/repo/connections/${id}`);
  }

  toggle(id) {
    return this.request.post(`/api/repo/connections/${id}/toggle`, { data: {} });
  }

  setMonitorInterval(id, data) {
    return this.request.post(`/api/repo/connections/${id}/monitor-interval`, { data });
  }

  uploadDatabaseFile(multipart) {
    return this.request.post('/api/repo/connections/upload', { multipart });
  }

  uploadSourceFile(multipart) {
    return this.request.post('/api/repo/connections/upload-source-file', { multipart });
  }

  create(data) {
    return this.request.post('/api/repo/connections', { data }); // tests only send invalid bodies
  }

  test(data) {
    return this.request.post('/api/repo/connections/test', { data });
  }
}

module.exports = { ConnectionsClient };
