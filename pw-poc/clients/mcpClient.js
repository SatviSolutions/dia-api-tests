// MCP server registry (/api/mcp-servers). Tests never create or connect a server (a stdio server would spawn a process).
class McpClient {
  constructor(request) {
    this.request = request;
  }

  list() {
    return this.request.get('/api/mcp-servers');
  }

  tools() {
    return this.request.get('/api/mcp-servers/tools');
  }

  registry() {
    return this.request.get('/api/mcp-servers/registry');
  }

  create(data) { // tests only send invalid bodies
    return this.request.post('/api/mcp-servers', { data });
  }

  get(id) {
    return this.request.get(`/api/mcp-servers/${id}`);
  }

  update(id, data) {
    return this.request.put(`/api/mcp-servers/${id}`, { data });
  }

  delete(id) {
    return this.request.delete(`/api/mcp-servers/${id}`);
  }

  serverTools(id) {
    return this.request.get(`/api/mcp-servers/${id}/tools`);
  }
}

module.exports = { McpClient };
