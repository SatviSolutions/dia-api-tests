class TrinoClient {
  constructor(request) {
    this.request = request;
  }

  getStatus() {
    return this.request.get('/api/trino/status');
  }

  getConfig() {
    return this.request.get('/api/trino/config');
  }

  getQueries() {
    return this.request.get('/api/trino/queries');
  }

  query(data) {
    return this.request.post('/api/trino/query', { data });
  }

  getCatalogs() {
    return this.request.get('/api/trino/catalogs');
  }

  getSchemas(catalog) {
    return this.request.get(`/api/trino/catalogs/${catalog}/schemas`);
  }

  getConnectors() {
    return this.request.get('/api/trino/supported-connectors');
  }

  getFunctions() {
    return this.request.get('/api/trino/functions');
  }

  getCatalogConfigs() {
    return this.request.get('/api/trino/catalog-configs');
  }

  validateConnection(data) {
    return this.request.post('/api/trino/validate-connection', { data });
  }

  explain(data) {
    return this.request.post('/api/trino/query/explain', { data });
  }
}

module.exports = { TrinoClient };
