// Few-shot example sets (/api/fewshots). Tests never touch the seeded sets; they create and remove only their own.
class FewShotsClient {
  constructor(request) {
    this.request = request;
  }

  list() {
    return this.request.get('/api/fewshots/data');
  }

  get(id) {
    return this.request.get(`/api/fewshots/${id}`);
  }

  save(data) {
    return this.request.post('/api/fewshots/save', { data });
  }

  delete(id) {
    return this.request.post(`/api/fewshots/${id}/delete`, { data: {} });
  }
}

module.exports = { FewShotsClient };
