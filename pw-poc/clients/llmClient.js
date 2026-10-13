// LLM configuration (/api/repo/llm-providers, /llm-models, /api-keys). Tests never touch the real (Ollama) provider, never
// create a default provider/model, and never call a model: the only provider created points at a closed local port.
class LlmClient {
  constructor(request) {
    this.request = request;
  }

  list() {
    return this.request.get('/api/repo/llm-providers');
  }

  getProvider(id) {
    return this.request.get(`/api/repo/llm-providers/${id}`);
  }

  createProvider(data) {
    return this.request.post('/api/repo/llm-providers', { data });
  }

  updateProvider(id, data) {
    return this.request.put(`/api/repo/llm-providers/${id}`, { data });
  }

  deleteProvider(id) {
    return this.request.delete(`/api/repo/llm-providers/${id}`);
  }

  getModel(id) {
    return this.request.get(`/api/repo/llm-models/${id}`);
  }

  createModel(data) {
    return this.request.post('/api/repo/llm-models', { data });
  }

  updateModel(id, data) {
    return this.request.put(`/api/repo/llm-models/${id}`, { data });
  }

  deleteModel(id) {
    return this.request.delete(`/api/repo/llm-models/${id}`);
  }

  getApiKey(id) {
    return this.request.get(`/api/repo/api-keys/${id}`);
  }

  createApiKey(data) {
    return this.request.post('/api/repo/api-keys', { data });
  }

  updateApiKey(id, data) {
    return this.request.put(`/api/repo/api-keys/${id}`, { data });
  }

  deleteApiKey(id) {
    return this.request.delete(`/api/repo/api-keys/${id}`);
  }

  revealApiKey(id) {
    return this.request.get(`/api/repo/api-keys/${id}/reveal`);
  }
}

module.exports = { LlmClient };
