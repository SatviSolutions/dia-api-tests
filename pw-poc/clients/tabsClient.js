// Workspace tab state and result cache (/api/tabs/*). save/cleanup/clearUserData change the CALLER's own ephemeral state:
// only the tab-state lifecycle test uses them, and it restores the original state.
class TabsClient {
  constructor(request) {
    this.request = request;
  }

  health() {
    return this.request.get('/api/tabs/health');
  }

  stats() {
    return this.request.get('/api/tabs/stats');
  }

  recentConnections() {
    return this.request.get('/api/tabs/recent-connections');
  }

  restore() {
    return this.request.get('/api/tabs/restore');
  }

  save(data) {
    return this.request.post('/api/tabs/save', { data });
  }

  history(params) {
    return this.request.get('/api/tabs/history', { params });
  }

  results(queryLogId) {
    return this.request.get(`/api/tabs/results/${queryLogId}`);
  }

  invalidate(queryLogId) {
    return this.request.delete(`/api/tabs/invalidate/${queryLogId}`);
  }

  cachedResults() {
    return this.request.get('/api/tabs/cached-results');
  }

  cleanup() { // admin only; removes expired cache entries
    return this.request.post('/api/tabs/cleanup', { data: {} });
  }

  clearUserData() { // clears the caller's cache data
    return this.request.delete('/api/tabs/clear-user-data');
  }
}

module.exports = { TabsClient };
