// Agent registry endpoints (/api/agents). Tests create, change and delete only their own uniquely named agent; chat and
// delegate (which call an LLM) are never used.
class AgentsClient {
  constructor(request) {
    this.request = request;
  }

  list() {
    return this.request.get('/api/agents/');
  }

  status() {
    return this.request.get('/api/agents/status');
  }

  get(id) {
    return this.request.get(`/api/agents/${id}`);
  }

  create(data) {
    return this.request.post('/api/agents/create', { data });
  }

  update(id, data) {
    return this.request.put(`/api/agents/${id}`, { data });
  }

  delete(id) {
    return this.request.delete(`/api/agents/${id}`);
  }

  enable(id) {
    return this.request.post(`/api/agents/${id}/enable`, { data: {} });
  }

  disable(id) {
    return this.request.post(`/api/agents/${id}/disable`, { data: {} });
  }
}

module.exports = { AgentsClient };
