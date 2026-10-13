// Prompt templates (/api/prompts). Tests only read the seeded prompts; they create, update and delete only their own
// uniquely named prompt.
class PromptsClient {
  constructor(request) {
    this.request = request;
  }

  list() {
    return this.request.get('/api/prompts/data');
  }

  get(id) {
    return this.request.get(`/api/prompts/${id}`);
  }

  save(data) {
    return this.request.post('/api/prompts/save', { data });
  }

  delete(id) {
    return this.request.post(`/api/prompts/${id}/delete`, { data: {} });
  }

  preview(id) {
    return this.request.post(`/api/prompts/${id}/preview`, { data: {} });
  }
}

module.exports = { PromptsClient };
