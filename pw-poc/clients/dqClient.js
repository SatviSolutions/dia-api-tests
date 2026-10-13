// Data-quality rules and runs (/api/datapilot/dq/*).
class DqClient {
  constructor(request) {
    this.request = request;
  }

  listRules() {
    return this.request.get('/api/datapilot/dq/rules');
  }

  createRule(data) {
    return this.request.post('/api/datapilot/dq/rules', { data });
  }

  deleteRule(id) {
    return this.request.delete(`/api/datapilot/dq/rules/${id}`);
  }

  evaluate(data) {
    return this.request.post('/api/datapilot/dq/evaluate', { data });
  }

  runs(queryLogId) {
    return this.request.get(`/api/datapilot/dq/runs/${queryLogId}`);
  }
}

module.exports = { DqClient };
