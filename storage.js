/**
 * AI Flow — LocalStorage Persistence Layer
 * Handles all data storage for workflows, users, history, chat, and agent config.
 */

const Storage = {
  /**
   * Get all registered users
   */
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem('aiflow_users') || '[]');
    } catch { return []; }
  },

  /**
   * Save users array
   */
  saveUsers(users) {
    localStorage.setItem('aiflow_users', JSON.stringify(users));
  },

  /**
   * Find user by email
   */
  findUser(email) {
    return this.getUsers().find(u => u.email === email);
  },

  /**
   * Add a new user
   */
  addUser(name, email, password) {
    const users = this.getUsers();
    const user = {
      id: 'user_' + Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    this.saveUsers(users);
    return user;
  },

  /**
   * Get current session
   */
  getSession() {
    try {
      return JSON.parse(localStorage.getItem('aiflow_session') || 'null');
    } catch { return null; }
  },

  /**
   * Save session
   */
  saveSession(user) {
    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem('aiflow_session', JSON.stringify(session));
    return session;
  },

  /**
   * Clear session
   */
  clearSession() {
    localStorage.removeItem('aiflow_session');
  },

  /**
   * Get user-specific key
   */
  userKey(key) {
    const session = this.getSession();
    const uid = session ? session.userId : 'anonymous';
    return `aiflow_${uid}_${key}`;
  },

  /**
   * Get workflows for current user
   */
  getWorkflows() {
    try {
      return JSON.parse(localStorage.getItem(this.userKey('workflows')) || '[]');
    } catch { return []; }
  },

  /**
   * Save workflows for current user
   */
  saveWorkflows(workflows) {
    localStorage.setItem(this.userKey('workflows'), JSON.stringify(workflows));
  },

  /**
   * Get a single workflow
   */
  getWorkflow(id) {
    return this.getWorkflows().find(w => w.id === id);
  },

  /**
   * Save or update a workflow
   */
  saveWorkflow(workflow) {
    const workflows = this.getWorkflows();
    const idx = workflows.findIndex(w => w.id === workflow.id);
    if (idx >= 0) {
      workflows[idx] = { ...workflows[idx], ...workflow, updatedAt: new Date().toISOString() };
    } else {
      workflows.push({
        ...workflow,
        id: workflow.id || 'wf_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    this.saveWorkflows(workflows);
    return workflow;
  },

  /**
   * Delete a workflow
   */
  deleteWorkflow(id) {
    const workflows = this.getWorkflows().filter(w => w.id !== id);
    this.saveWorkflows(workflows);
  },

  /**
   * Get run history
   */
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.userKey('history')) || '[]');
    } catch { return []; }
  },

  /**
   * Add a history entry
   */
  addHistory(entry) {
    const history = this.getHistory();
    history.unshift({
      id: 'run_' + Date.now(),
      ...entry,
      timestamp: new Date().toISOString()
    });
    // Keep last 200 entries
    if (history.length > 200) history.splice(200);
    localStorage.setItem(this.userKey('history'), JSON.stringify(history));
  },

  /**
   * Clear history
   */
  clearHistory() {
    localStorage.setItem(this.userKey('history'), '[]');
  },

  /**
   * Get chat conversations
   */
  getChats() {
    try {
      return JSON.parse(localStorage.getItem(this.userKey('chats')) || '[]');
    } catch { return []; }
  },

  /**
   * Save chat conversations
   */
  saveChats(chats) {
    localStorage.setItem(this.userKey('chats'), JSON.stringify(chats));
  },

  /**
   * Get agent configuration
   */
  getAgentConfig() {
    try {
      return JSON.parse(localStorage.getItem(this.userKey('agentConfig')) || 'null');
    } catch { return null; }
  },

  /**
   * Save agent configuration
   */
  saveAgentConfig(config) {
    localStorage.setItem(this.userKey('agentConfig'), JSON.stringify(config));
  },

  /**
   * Get integrations state
   */
  getIntegrations() {
    try {
      return JSON.parse(localStorage.getItem(this.userKey('integrations')) || '{}');
    } catch { return {}; }
  },

  /**
   * Save integration state
   */
  saveIntegration(key, value) {
    const integrations = this.getIntegrations();
    integrations[key] = value;
    localStorage.setItem(this.userKey('integrations'), JSON.stringify(integrations));
  },

  /**
   * Get theme preference
   */
  getTheme() {
    return localStorage.getItem('aiflow_theme') || 'light';
  },

  /**
   * Save theme preference
   */
  saveTheme(theme) {
    localStorage.setItem('aiflow_theme', theme);
  },

  /**
   * Get active workflow ID in builder
   */
  getActiveWorkflowId() {
    return localStorage.getItem(this.userKey('activeWorkflowId'));
  },

  /**
   * Set active workflow ID in builder
   */
  setActiveWorkflowId(id) {
    localStorage.setItem(this.userKey('activeWorkflowId'), id || '');
  }
};
