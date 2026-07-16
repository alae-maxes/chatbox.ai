/**
 * AI Flow — AI Chat Module
 * Manages multi-conversation AI-powered chat with Gemini API.
 */

const Chat = {
  conversations: [],
  activeChatId: null,

  init() {
    this.loadConversations();
    this.bindEvents();
  },

  /**
   * Load saved conversations
   */
  loadConversations() {
    this.conversations = Storage.getChats();
    this.renderChatList();
    if (this.conversations.length > 0) {
      this.openChat(this.conversations[0].id);
    }
  },

  /**
   * Save conversations to storage
   */
  saveConversations() {
    Storage.saveChats(this.conversations);
  },

  /**
   * Bind chat view events
   */
  bindEvents() {
    document.getElementById('newChatBtn').addEventListener('click', () => this.createChat());
    document.getElementById('chatSendBtn').addEventListener('click', () => this.sendMessage());
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });
  },

  /**
   * Create a new conversation
   */
  createChat() {
    const chat = {
      id: 'chat_' + Date.now(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    };
    this.conversations.unshift(chat);
    this.saveConversations();
    this.renderChatList();
    this.openChat(chat.id);
  },

  /**
   * Open a specific chat
   */
  openChat(chatId) {
    this.activeChatId = chatId;
    this.renderChatList();
    this.renderMessages();
  },

  /**
   * Delete a conversation
   */
  deleteChat(chatId) {
    this.conversations = this.conversations.filter(c => c.id !== chatId);
    this.saveConversations();
    if (this.activeChatId === chatId) {
      this.activeChatId = this.conversations.length > 0 ? this.conversations[0].id : null;
    }
    this.renderChatList();
    this.renderMessages();
    Toast.show('Conversation deleted.', 'info');
  },

  /**
   * Render the chat list sidebar
   */
  renderChatList() {
    const container = document.getElementById('chatList');
    container.innerHTML = '';

    if (this.conversations.length === 0) {
      container.innerHTML = '<p style="font-size:12px;color:var(--text-tertiary);text-align:center;padding:20px;">No conversations yet</p>';
      return;
    }

    this.conversations.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'chat-list-item' + (chat.id === this.activeChatId ? ' active' : '');
      item.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${chat.title}</span>
          <button class="btn-icon delete-chat" data-chat-id="${chat.id}" style="font-size:10px;width:22px;height:22px;flex-shrink:0;">🗑️</button>
        </div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:2px;">${chat.messages.length} messages</div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-chat')) return;
        this.openChat(chat.id);
      });

      item.querySelector('.delete-chat').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteChat(chat.id);
      });

      container.appendChild(item);
    });
  },

  /**
   * Render messages for the active chat
   */
  renderMessages() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';

    const chat = this.conversations.find(c => c.id === this.activeChatId);
    if (!chat || chat.messages.length === 0) {
      container.innerHTML = `
        <div class="chat-welcome">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="1.5"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/></svg>
          <h3>AI Chat</h3>
          <p>Powered by Google Gemini API. Start a conversation!</p>
        </div>
      `;
      return;
    }

    chat.messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'chat-message ' + msg.role;
      div.textContent = msg.content;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  },

  /**
   * Send a message in the current chat
   */
  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const config = Storage.getAgentConfig();
    if (!config?.apiKey) {
      Toast.show('Please configure your Gemini API key in AI Agent settings.', 'warning');
      return;
    }

    // Auto-create a chat if none active
    if (!this.activeChatId) {
      this.createChat();
    }

    const chat = this.conversations.find(c => c.id === this.activeChatId);
    if (!chat) return;

    // Update chat title based on first message
    if (chat.messages.length === 0) {
      chat.title = message.slice(0, 40) + (message.length > 40 ? '...' : '');
    }

    // Add user message
    chat.messages.push({ role: 'user', content: message });
    input.value = '';
    input.style.height = 'auto';
    this.renderMessages();
    this.renderChatList();
    this.saveConversations();

    // Add loading placeholder
    chat.messages.push({ role: 'bot', content: '⏳ Thinking...' });
    this.renderMessages();

    try {
      // Build conversation history for context
      const history = chat.messages
        .filter(m => m.role !== 'bot' || !m.content.includes('⏳'))
        .slice(0, -1)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = history
        ? `Previous conversation:\n${history}\n\nUser: ${message}\nAssistant:`
        : message;

      const response = await GeminiAPI.generate(
        prompt,
        config.model || 'gemini-2.0-flash',
        config.temperature || 0.7,
        config.maxTokens || 2048
      );

      // Replace loading with response
      chat.messages[chat.messages.length - 1] = { role: 'bot', content: response };
      this.renderMessages();
      this.saveConversations();
    } catch (e) {
      chat.messages[chat.messages.length - 1] = {
        role: 'bot',
        content: '❌ Error: ' + e.message
      };
      this.renderMessages();
      this.saveConversations();
    }
  }
};
