/**
 * AI Flow — Workflows Module
 * Manages the workflows list view: CRUD operations, card rendering, and navigation to builder.
 */

const Workflows = {
  init() {
    this.grid = document.getElementById('workflowGrid');
    this.emptyState = document.getElementById('emptyWorkflows');
    this.createBtns = [
      document.getElementById('createWorkflowBtn'),
      document.getElementById('createWorkflowBtn2')
    ];

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    this.createBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => this.createWorkflow());
      }
    });
  },

  /**
   * Get all workflows and render them
   */
  render() {
    const workflows = Storage.getWorkflows();
    this.grid.innerHTML = '';

    if (workflows.length === 0) {
      this.emptyState.style.display = 'flex';
      this.grid.style.display = 'none';
      return;
    }

    this.emptyState.style.display = 'none';
    this.grid.style.display = 'grid';

    workflows.forEach(wf => {
      const card = this.createCard(wf);
      this.grid.appendChild(card);
    });
  },

  /**
   * Create a workflow card element
   */
  createCard(wf) {
    const card = document.createElement('div');
    card.className = 'workflow-card';

    const nodeCount = wf.nodes ? wf.nodes.length : 0;
    const status = wf.status || 'draft';

    card.innerHTML = `
      <div class="workflow-card-header">
        <span class="workflow-card-title">${this.escape(wf.name || 'Untitled')}</span>
        <span class="workflow-card-status ${status}"></span>
      </div>
      <div class="workflow-card-desc">${nodeCount} node${nodeCount !== 1 ? 's' : ''} • Status: ${status}</div>
      <div class="workflow-card-meta">
        <span>Updated: ${this.formatDate(wf.updatedAt)}</span>
      </div>
      <div class="workflow-card-actions">
        <button class="btn btn-sm btn-primary edit-wf" data-id="${wf.id}">Edit</button>
        <button class="btn btn-sm btn-success run-wf" data-id="${wf.id}">Run</button>
        <button class="btn btn-sm btn-outline delete-wf" data-id="${wf.id}">Delete</button>
      </div>
    `;

    // Click on card (not on buttons) to open builder
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      this.openBuilder(wf.id);
    });

    // Edit button
    card.querySelector('.edit-wf').addEventListener('click', (e) => {
      e.stopPropagation();
      this.openBuilder(wf.id);
    });

    // Run button
    card.querySelector('.run-wf').addEventListener('click', (e) => {
      e.stopPropagation();
      this.runWorkflow(wf.id);
    });

    // Delete button
    card.querySelector('.delete-wf').addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteWorkflow(wf.id);
    });

    return card;
  },

  /**
   * Create a new workflow and open it in the builder
   */
  createWorkflow() {
    const workflow = {
      id: 'wf_' + Date.now(),
      name: 'New Workflow',
      status: 'draft',
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    Storage.saveWorkflow(workflow);
    this.openBuilder(workflow.id);
    Toast.show('Workflow created!', 'success');
  },

  /**
   * Open a workflow in the builder
   */
  openBuilder(workflowId) {
    Storage.setActiveWorkflowId(workflowId);
    App.navigate('builder');
    App.loadBuilder(workflowId);
  },

  /**
   * Delete a workflow after confirmation
   */
  deleteWorkflow(id) {
    const wf = Storage.getWorkflow(id);
    if (!wf) return;
    if (confirm(`Delete "${wf.name || 'Untitled'}"? This cannot be undone.`)) {
      Storage.deleteWorkflow(id);
      this.render();
      // If active workflow was deleted, clear builder
      if (Storage.getActiveWorkflowId() === id) {
        Storage.setActiveWorkflowId(null);
      }
      Toast.show('Workflow deleted.', 'info');
    }
  },

  /**
   * Run a workflow (simulation)
   */
  async runWorkflow(id) {
    const wf = Storage.getWorkflow(id);
    if (!wf || !wf.nodes || wf.nodes.length === 0) {
      Toast.show('Workflow has no nodes to execute.', 'warning');
      return;
    }

    Toast.show('Executing workflow...', 'info');
    Storage.addHistory({
      workflowId: id,
      workflowName: wf.name,
      status: 'running',
      startedAt: new Date().toISOString()
    });

    // Simulate execution delay
    await new Promise(r => setTimeout(r, 1500));

    // Simulate AI node execution if present
    const hasAINode = wf.nodes.some(n => n.type === 'ai-agent' || n.type === 'ai-chat');
    let result = 'success';

    if (hasAINode) {
      try {
        const config = Storage.getAgentConfig();
        if (config?.apiKey) {
          await GeminiAPI.generate('Execute the following workflow step with your capabilities.', 'gemini-2.0-flash', 0.7);
        }
      } catch {
        result = 'failed';
      }
    }

    Storage.addHistory({
      workflowId: id,
      workflowName: wf.name,
      status: result,
      duration: Math.floor(Math.random() * 3000) + 500,
      completedAt: new Date().toISOString()
    });

    Toast.show(`Workflow execution ${result === 'success' ? 'completed' : 'failed'}!`, result === 'success' ? 'success' : 'error');
    History.render();
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};
