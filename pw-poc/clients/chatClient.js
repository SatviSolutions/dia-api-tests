// Chat configuration reads (/chat/*). Note the mount point: /chat/..., not /api/chat/.... Sending chat messages is
// WebSocket/LLM based and is not covered here.
class ChatClient {
  constructor(request) {
    this.request = request;
  }

  providers() {
    return this.request.get('/chat/providers');
  }

  prompts() {
    return this.request.get('/chat/prompts');
  }
}

module.exports = { ChatClient };
