/**
 * AI Flow — Application Orchestration
 * Initializes the app, manages navigation, theme, and coordinates all modules.
 */

const App = {
  currentView: 'workflows',

  /**
   * Initialize the entire application
   */
  init() {
    // Init toast first
    Toast.init();

    // Init theme
    this.initTheme();

    // Init auth
    Auth.init();

    // Init builder
    Builder.init();

    // If already authenticated (session exists), show app immediately
    if (Auth.isAuthenticated()) {
      Auth.showApp();
      this.loadCurrentView();
    }
  },

  /**
   * Initialize theme (light/dark mode)
   */
  initTheme() {
    const savedTheme = Storage.getTheme();
    this.applyTheme(savedTheme);

    // Theme toggle (auth overlay)
    const toggleAuth = document.getElementById('themeToggleAuth');
    if (toggleAuth) {
      toggleAuth.addEventListener('click', () => this.toggleTheme());
    }

    // Theme toggle (sidebar)
    const toggleSide = document.getElementById('themeToggleSide');
    if (toggleSide) {
      toggleSide.addEventListener('click', () => this.toggleTheme());
    }
  },

  /**
   * Apply a theme to the document
   */
  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    Storage.saveTheme(theme);

    // Update toggle button icon
    const toggleSide = document.getElementById('themeToggleSide');
    if (toggleSide) {
      toggleSide.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
  },

  /**
   * Load the current view after auth
   */
  loadCurrentView() {
    // Default: show workflows
    this.navigate('workflows');

    // If there's an active workflow in builder, we could also auto-switch
    // But for a fresh session, workflows is the right landing
  },

  /**
   * Navigate to a specific view
   */
  navigate(viewName) {
    this.currentView = viewName;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById('view-' + viewName);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    // Update title
    const titles = {
      workflows: 'Workflows',
      builder: 'Workflow Builder',
      agent: 'AI Agent',
      chat: 'AI Chat',
      history: 'Run History',
      integrations: 'Integrations'
    };
    document.getElementById('viewTitle').textContent = titles[viewName] || viewName;

    // Initialize view-specific modules on first visit
    switch (viewName) {
      case 'workflows':
        Workflows.render();
        break;
      case 'agent':
        if (!this._agentInited) { Agent.init(); this._agentInited = true; }
        break;
      case 'chat':
        if (!this._chatInited) { Chat.init(); this._chatInited = true; }
        break;
      case 'history':
        if (!this._historyInited) { History.init(); this._historyInited = true; }
        History.render();
        break;
      case 'integrations':
        if (!this._integrationsInited) { Integrations.init(); this._integrationsInited = true; }
        break;
    }
  },

  /**
   * Load a workflow into the builder view
   */
  loadBuilder(workflowId) {
    Builder.loadWorkflow(workflowId);
  },

  /**
   * Bind all global navigation events
   */
  bindNavigation() {
    // Sidebar nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.navigate(view);

        // Close mobile sidebar if open
        document.getElementById('sidebar').classList.remove('open');
      });
    });

    // Hamburger for mobile
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');

    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && e.target !== hamburger && !hamburger.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }
};

// ============================================================
// Initialize when DOM is ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  App.bindNavigation();
  App.init();

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  console.log('🚀 AI Flow — Workflow Automation Platform Ready');
  console.log('Features: Drag-and-drop builder | AI Agent | AI Chat | Webhooks | Gmail | Telegram | WhatsApp | Google Sheets | Database | History | Auth | Dark Mode');
  console.log('AI powered by Google Gemini API');
  console.log('No frameworks, no build step — pure HTML, CSS, JavaScript');
});
