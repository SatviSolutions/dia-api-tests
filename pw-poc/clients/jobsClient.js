// Background jobs (/api/jobs). Read-only plus unknown-id calls: tests never create, pause, retry or delete a job and
// never touch the worker pool.
class JobsClient {
  constructor(request) {
    this.request = request;
  }

  list() {
    return this.request.get('/api/jobs');
  }

  health() {
    return this.request.get('/api/jobs/health');
  }

  workers() {
    return this.request.get('/api/jobs/workers/status');
  }

  get(id) {
    return this.request.get(`/api/jobs/${id}`);
  }

  details(id) {
    return this.request.get(`/api/jobs/${id}/details`);
  }

  logs(id) {
    return this.request.get(`/api/jobs/${id}/logs`);
  }

  tasks(id) {
    return this.request.get(`/api/jobs/${id}/tasks`);
  }

  cancel(id) {
    return this.request.post(`/api/jobs/${id}/cancel`, { data: {} });
  }
}

module.exports = { JobsClient };
