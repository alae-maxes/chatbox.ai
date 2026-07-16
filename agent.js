/**
 * AI Flow — AI Agent Module
 * Manages the agent configuration and test chat interface.
 */

const Agent = {
  init() {
    this.loadConfig();
    this.bindEvents();
  },

  /**
   * Load saved agent configuration
   */
  loadConfig() {
    const config = Storage.getAgentConfig();
    if (config) {
      document.getElementById('agentName').value = config.name || '';
      document.getElementById('agentSystemPrompt').value = config.systemPrompt || '';
      document.getElementById('agentModel').value = config.model || 'gemini-2.0-flash';
      document.getElementById('agentTemperature').value = config.temperature || 0.7;
      document.getElementById('tempValue').textContent = config.temperature || 0.7;
      document.getElementById('agentMaxTokens').value = config.maxTokens || 2048;
      document.getElementById('geminiApiKey').value = config.apiKey || '';
    }
  },

  /**
   * Bind agent view events
   */
  bindEvents() {
    // Temperature slider
    const tempSlider = document.getElementById('agentTemperature');
    const tempValue = document.getElementById('tempValue');
    tempSlider.addEventListener('input', () => {
      tempValue.textContent = tempSlider.value;
    });

    // Toggle API key visibility
    const apiKeyInput = document.getElementById('geminiApiKey');
    const toggleBtn = document.getElementById('toggleApiKey');
    toggleBtn.addEventListener('click', () => {
      apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
      toggleBtn.textContent = apiKeyInput.type === 'password' ? '👁️' : '🙈';
    });

    // Save config
    document.getElementById('saveAgentConfig').addEventListener('click', () => this.saveConfig());

    // Chat send
    document.getElementById('agentChatSend').addEventListener('click', () => this.sendAgentMessage());
    document.getElementById('agentChatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendAgentMessage();
    });
  },

  /**
   * Save agent configuration
   */
  saveConfig() {
    const config = {
      name: document.getElementById('agentName').value.trim(),
      systemPrompt: document.getElementById('agentSystemPrompt').value.trim(),
      model: document.getElementById('agentModel').value,
      temperature: parseFloat(document.getElementById('agentTemperature').value),
      maxTokens: parseInt(document.getElementById('agentMaxTokens').value),
      apiKey: document.getElementById('geminiApiKey').value.trim()
    };

    Storage.saveAgentConfig(config);
    Toast.show('Agent configuration saved!', 'success');
  },

  /**
   * Send a message to the AI agent
   */
  async sendAgentMessage() {
    const input = document.getElementById('agentChatInput');
    const message = input.value.trim();
    if (!message) return;

    const config = Storage.getAgentConfig();
    if (!config?.apiKey) {
      Toast.show('Please configure your Gemini API key first.', 'warning');
      return;
    }

    const messagesContainer = document.getElementById('agentChatMessages');

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'agent-message user';
    userMsg.textContent = message;
    messagesContainer.appendChild(userMsg);
    input.value = '';

    // Add loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'agent-message bot';
    loadingMsg.textContent = '⏳ Thinking...';
    loadingMsg.id = 'agentLoadingMsg';
    messagesContainer.appendChild(loadingMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const systemPrompt = config.systemPrompt || 'You are a helpful AI automation assistant.';
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;
      const response = await GeminiAPI.generate(
        fullPrompt,
        config.model || 'gemini-2.0-flash',
        config.temperature || 0.7,
        config.maxTokens || 2048
      );

      // Remove loading
      loadingMsg.remove();

      // Add bot response
      const botMsg = document.createElement('div');
      botMsg.className = 'agent-message bot';
      botMsg.textContent = response;
      messagesContainer.appendChild(botMsg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (e) {
      loadingMsg.textContent = '❌ Error: ' + e.message;
      loadingMsg.style.color = 'var(--error)';
    }
  }
};
