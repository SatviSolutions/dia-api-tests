class DataPilotClient {
  constructor(request) {
    this.request = request;
  }

  execute(data) {
    return this.request.post('/api/datapilot/execute', { data });
  }

  // Sends the body byte-for-byte (for malformed-JSON tests). A Buffer is required: Playwright would otherwise
  // JSON-encode a plain string, and the server would receive a valid JSON string instead of malformed JSON.
  executeRaw(rawBody) {
    return this.request.post('/api/datapilot/execute', { data: Buffer.from(rawBody), headers: { 'Content-Type': 'application/json' } });
  }

  count(data) {
    return this.request.post('/api/datapilot/count', { data });
  }

  status(queryLogId) {
    return this.request.get(`/api/datapilot/status/${queryLogId}`);
  }

  cancel(queryLogId) {
    return this.request.post(`/api/datapilot/cancel/${queryLogId}`, { data: {} });
  }

  // SQL helper endpoints that all take {sql, ...}: format, minify, validate, transpile, optimize, lineage,
  // check-safety, extract-params.
  utility(name, data) {
    return this.request.post(`/api/datapilot/${name}`, { data });
  }

  dialects() {
    return this.request.get('/api/datapilot/dialects');
  }

  explain(data) {
    return this.request.post('/api/datapilot/explain', { data });
  }

  // SQL parsing, visualization and autocomplete helpers
  health() {
    return this.request.get('/api/datapilot/health');
  }

  parse(data) {
    return this.request.post('/api/datapilot/parse', { data });
  }

  visualize(data) {
    return this.request.post('/api/datapilot/visualize', { data });
  }

  autocompleteSettings() {
    return this.request.get('/api/datapilot/autocomplete-settings');
  }

  impliedRelationshipsSettings() {
    return this.request.get('/api/datapilot/implied-relationships-settings');
  }

  sqlContextStats() {
    return this.request.get('/api/datapilot/sql-context/stats');
  }

  sqlContext(data) {
    return this.request.post('/api/datapilot/sql-context', { data });
  }

  joinHints(data) {
    return this.request.post('/api/datapilot/join-hints', { data });
  }

  canonicalJoinHints(data) {
    return this.request.post('/api/datapilot/canonical-join-hints', { data });
  }

  history(params) {
    return this.request.get('/api/datapilot/history', { params });
  }

  listSavedQueries() {
    return this.request.get('/api/datapilot/saved-queries');
  }

  createSavedQuery(data) {
    return this.request.post('/api/datapilot/saved-queries', { data });
  }

  updateSavedQuery(id, data) {
    return this.request.put(`/api/datapilot/saved-queries/${id}`, { data });
  }

  deleteSavedQuery(id) {
    return this.request.delete(`/api/datapilot/saved-queries/${id}`);
  }
}

module.exports = { DataPilotClient };
