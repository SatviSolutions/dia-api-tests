// Semantic models (/api/semantic) and knowledge graphs (/api/connections/.../knowledge-graph).
class SemanticClient {
  constructor(request) {
    this.request = request;
  }

  dashboard() {
    return this.request.get('/api/semantic/dashboard');
  }

  listModels() {
    return this.request.get('/api/semantic');
  }

  listPhysicalDatabases() {
    return this.request.get('/api/semantic/physical-databases');
  }

  getPhysicalDatabase(id) {
    return this.request.get(`/api/semantic/physical-databases/${id}`);
  }

  modelsByConnection(connectionId) {
    return this.request.get(`/api/semantic/by-connection/${connectionId}`);
  }

  getModel(id) {
    return this.request.get(`/api/semantic/${id}`);
  }

  modelTables(id) {
    return this.request.get(`/api/semantic/${id}/tables`);
  }

  createModel(data) { // tests only send an invalid body
    return this.request.post('/api/semantic', { data });
  }

  knowledgeGraphOverview() {
    return this.request.get('/api/connections/knowledge-graphs/overview');
  }

  knowledgeGraph(connectionId) {
    return this.request.get(`/api/connections/${connectionId}/knowledge-graph`);
  }

  knowledgeGraphNodes(connectionId) {
    return this.request.get(`/api/connections/${connectionId}/knowledge-graph/nodes`);
  }

  knowledgeGraphSearch(connectionId, data) {
    return this.request.post(`/api/connections/${connectionId}/knowledge-graph/search`, { data });
  }
}

module.exports = { SemanticClient };
