// Cache manager (/api/cache-manager/api/*) and the per-query result cache (/api/datapilot/cache/*).
class CacheClient {
  constructor(request) {
    this.request = request;
  }

  stats() {
    return this.request.get('/api/cache-manager/api/cache-stats');
  }

  entries() {
    return this.request.get('/api/cache-manager/api/cache-entries');
  }

  entry(queryLogId) {
    return this.request.get(`/api/cache-manager/api/cache-entry/${queryLogId}`);
  }

  cleanupExpired() { // removes only entries that have already expired
    return this.request.post('/api/cache-manager/api/cleanup-expired', { data: {} });
  }

  resultStatus(queryLogId) {
    return this.request.get(`/api/datapilot/cache/${queryLogId}/status`);
  }

  resultProfile(queryLogId) {
    return this.request.get(`/api/datapilot/cache/${queryLogId}/profile`);
  }

  resultPage(queryLogId, data) {
    return this.request.post(`/api/datapilot/cache/${queryLogId}/page`, { data });
  }
}

module.exports = { CacheClient };
