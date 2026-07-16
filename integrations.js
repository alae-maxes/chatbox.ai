/**
 * AI Flow — Integrations Module
 * Manages integration cards for all supported services.
 */

const Integrations = {
  integrationList: [
    { key: 'gmail', name: 'Gmail', icon: '📧', color: '#EA4335', description: 'Send and read emails via Gmail API' },
    { key: 'telegram', name: 'Telegram', icon: '📨', color: '#26A5E4', description: 'Send messages via Telegram Bot API' },
    { key: 'whatsapp', name: 'WhatsApp', icon: '💚', color: '#25D366', description: 'Send messages via WhatsApp Business API' },
    { key: 'sheets', name: 'Google Sheets', icon: '📊', color: '#34A853', description: 'Read and write Google Sheets data' },
    { key: 'slack', name: 'Slack', icon: '💬', color: '#4A154B', description: 'Send messages and interact with Slack' },
    { key: 'discord', name: 'Discord', icon: '🎮', color: '#5865F2', description: 'Send messages via Discord webhooks' },
    { key: 'twitter', name: 'X (Twitter)', icon: '🐦', color: '#1DA1F2', description: 'Post tweets and read feeds' },
    { key: 'notion', name: 'Notion', icon: '📝', color: '#000000', description: 'Create and update Notion pages' },
    { key: 'github', name: 'GitHub', icon: '🐙', color: '#333333', description: 'Manage repos, issues, and PRs' },
    { key: 'stripe', name: 'Stripe', icon: '💳', color: '#635BFF', description: 'Process payments and manage subscriptions' },
    { key: 'webhook', name: 'Custom Webhook', icon: '🔗', color: '#8B5CF6', description: 'Receive data from any HTTP source' },
    { key: 'http', name: 'HTTP API', icon: '🌐', color: '#06B6D4', description: 'Call any REST API endpoint' }
  ],

  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const container = document.getElementById('integrationsGrid');
    const states = Storage.getIntegrations();

    container.innerHTML = '';

    this.integrationList.forEach(integration => {
      const isConnected = !!states[integration.key];

      const card = document.createElement('div');
      card.className = 'integration-card' + (isConnected ? ' connected' : '');
      card.innerHTML = `
        <div class="integration-card-icon" style="background:${integration.color}20;color:${integration.color}">
          ${integration.icon}
        </div>
        <div class="integration-card-info">
          <div class="integration-card-name">${integration.name}</div>
          <div class="integration-card-status ${isConnected ? 'connected-status' : 'disconnected-status'}">
            ${isConnected ? '✓ Connected' : '○ Not connected'}
          </div>
        </div>
        <button class="btn btn-sm ${isConnected ? 'btn-outline' : 'btn-primary'}"
                data-integration="${integration.key}">
          ${isConnected ? 'Disconnect' : 'Connect'}
        </button>
      `;

      container.appendChild(card);
    });
  },

  bindEvents() {
    document.getElementById('integrationsGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-integration]');
      if (!btn) return;

      const key = btn.dataset.integration;
      const states = Storage.getIntegrations();

      if (states[key]) {
        // Disconnect
        delete states[key];
        Storage.saveIntegration(key, null);
        Toast.show('Disconnected from ' + this.getIntegrationName(key), 'info');
      } else {
        // Simulate connect (in production, this would redirect to OAuth)
        Storage.saveIntegration(key, {
          connectedAt: new Date().toISOString(),
          status: 'active'
        });
        Toast.show('Connected to ' + this.getIntegrationName(key) + '!', 'success');
      }

      this.render();
    });
  },

  getIntegrationName(key) {
    const found = this.integrationList.find(i => i.key === key);
    return found ? found.name : key;
  }
};
