/**
 * AI Flow — Workflow Builder Module
 * Drag-and-drop node-based workflow builder with canvas, connections, and node configuration.
 */

const Builder = {
  workflow: null,
  nodes: [],
  connections: [],
  selectedNodeId: null,
  isDragging: false,
  isConnecting: false,
  connectFromNodeId: null,
  connectFromPort: null,
  dragNode: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  canvasScale: 1,

  init() {
    this.canvas = document.getElementById('flowCanvas');
    this.connectionsLayer = document.getElementById('connectionsLayer');
    this.dropZone = document.getElementById('canvasDropZone');
    this.nameInput = document.getElementById('workflowNameInput');
    this.nodeConfigModal = document.getElementById('nodeConfigModal');
    this.nodeConfigTitle = document.getElementById('nodeConfigTitle');
    this.nodeConfigBody = document.getElementById('nodeConfigBody');
    this.palette = document.getElementById('nodePalette');

    this.bindPaletteEvents();
    this.bindCanvasEvents();
    this.bindToolbarEvents();
    this.bindModalEvents();
  },

  /**
   * Load a workflow into the builder
   */
  loadWorkflow(workflowId) {
    const wf = Storage.getWorkflow(workflowId);
    if (!wf) {
      this.clearCanvas();
      this.workflow = null;
      return;
    }

    this.workflow = wf;
    this.nodes = wf.nodes || [];
    this.connections = wf.connections || [];
    this.nameInput.value = wf.name || '';
    this.renderCanvas();
  },

  /**
   * Clear the canvas
   */
  clearCanvas() {
    this.nodes = [];
    this.connections = [];
    this.selectedNodeId = null;
    this.nameInput.value = '';
    this.clearAllNodeElements();
    this.drawConnections();
    this.dropZone.classList.remove('hidden');
    Storage.setActiveWorkflowId(null);
  },

  /**
   * Render all nodes on the canvas
   */
  renderCanvas() {
    this.clearAllNodeElements();
    if (this.nodes.length === 0) {
      this.dropZone.classList.remove('hidden');
    } else {
      this.dropZone.classList.add('hidden');
    }

    this.nodes.forEach(node => {
      this.createNodeElement(node);
    });
    this.drawConnections();
  },

  /**
   * Create a DOM element for a node
   */
  createNodeElement(node) {
    const el = document.createElement('div');
    el.className = 'canvas-node';
    el.id = 'node-' + node.id;
    el.style.left = (node.x || 100) + 'px';
    el.style.top = (node.y || 100) + 'px';
    el.dataset.nodeId = node.id;

    if (node.id === this.selectedNodeId) {
      el.classList.add('selected');
    }

    const icon = this.getNodeIcon(node.type);
    const label = this.getNodeLabel(node.type);

    el.innerHTML = `
      <div class="node-header">
        <span class="node-icon" style="background:${icon.color}">${icon.emoji}</span>
        <span>${label}</span>
      </div>
      <div class="node-body">${node.config?.description || this.getDefaultDesc(node.type)}</div>
      <div class="node-port input" data-port="input" data-node-id="${node.id}"></div>
      <div class="node-port output" data-port="output" data-node-id="${node.id}"></div>
    `;

    // Node drag
    el.addEventListener('mousedown', (e) => this.onNodeMouseDown(e, node));

    // Double-click to configure
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.openNodeConfig(node);
    });

    // Port connection
    el.querySelectorAll('.node-port').forEach(port => {
      port.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.onPortMouseDown(e, node.id, port.dataset.port);
      });
    });

    this.canvas.appendChild(el);
  },

  /**
   * Remove all node DOM elements from canvas
   */
  clearAllNodeElements() {
    this.canvas.querySelectorAll('.canvas-node').forEach(el => el.remove());
  },

  /**
   * Bind drag events for palette items
   */
  bindPaletteEvents() {
    document.querySelectorAll('.palette-node').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('nodeType', item.dataset.nodeType);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  },

  /**
   * Bind drop and canvas events
   */
  bindCanvasEvents() {
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('nodeType');
      if (!nodeType) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left + this.canvas.scrollLeft - 90;
      const y = e.clientY - rect.top + this.canvas.scrollTop - 30;

      this.addNode(nodeType, x, y);
    });

    // Click on canvas to deselect
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.target === this.canvas || e.target === this.connectionsLayer || e.target.classList.contains('canvas-drop-zone')) {
        this.selectedNodeId = null;
        this.renderCanvas();
      }
    });

    // Mouse move for dragging nodes
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (App.currentView !== 'builder') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedNodeId && document.activeElement === document.body) {
          this.deleteNode(this.selectedNodeId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveWorkflow();
      }
    });
  },

  /**
   * Bind toolbar buttons
   */
  bindToolbarEvents() {
    document.getElementById('saveWorkflowBtn').addEventListener('click', () => this.saveWorkflow());
    document.getElementById('runWorkflowBtn').addEventListener('click', () => this.executeWorkflow());
    document.getElementById('exportWorkflowBtn').addEventListener('click', () => this.exportWorkflow());
    document.getElementById('importWorkflowBtn').addEventListener('click', () => this.showImportModal());

    this.nameInput.addEventListener('input', () => {
      if (this.workflow) {
        this.workflow.name = this.nameInput.value;
      }
    });
    this.nameInput.addEventListener('blur', () => this.saveWorkflow(true));
  },

  /**
   * Bind node config modal events
   */
  bindModalEvents() {
    document.getElementById('nodeConfigClose').addEventListener('click', () => this.closeModal());
    document.getElementById('nodeConfigCancel').addEventListener('click', () => this.closeModal());
    document.getElementById('nodeConfigSave').addEventListener('click', () => this.saveNodeConfig());
  },

  /**
   * Add a new node to the canvas
   */
  addNode(type, x, y) {
    if (!this.workflow) {
      // Auto-create a workflow if none active
      this.workflow = {
        id: 'wf_' + Date.now(),
        name: 'Untitled Workflow',
        status: 'draft',
        nodes: [],
        connections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      Storage.saveWorkflow(this.workflow);
      Storage.setActiveWorkflowId(this.workflow.id);
      this.nameInput.value = this.workflow.name;
    }

    const node = {
      id: 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: type,
      x: Math.max(0, x),
      y: Math.max(0, y),
      config: {}
    };

    this.nodes.push(node);
    this.dropZone.classList.add('hidden');
    this.createNodeElement(node);
    this.saveWorkflow();
    Toast.show(`Added ${this.getNodeLabel(type)} node`, 'info');
  },

  /**
   * Delete a node and its connections
   */
  deleteNode(nodeId) {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.connections = this.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
    this.selectedNodeId = null;
    this.renderCanvas();
    this.saveWorkflow();
    Toast.show('Node deleted.', 'info');
  },

  /**
   * Update an existing node
   */
  updateNode(nodeId, updates) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node, updates);
    }
  },

  /**
   * Add a connection between two nodes
   */
  addConnection(fromNodeId, toNodeId) {
    // Prevent duplicate
    if (this.connections.some(c => c.from === fromNodeId && c.to === toNodeId)) return;
    // Prevent self-connection
    if (fromNodeId === toNodeId) return;

    this.connections.push({
      id: 'conn_' + Date.now(),
      from: fromNodeId,
      to: toNodeId
    });
    this.drawConnections();
    this.saveWorkflow();
  },

  /**
   * Draw all connections on the SVG layer
   */
  drawConnections() {
    const svg = this.connectionsLayer;
    svg.innerHTML = '';

    this.connections.forEach(conn => {
      const fromEl = document.getElementById('node-' + conn.from);
      const toEl = document.getElementById('node-' + conn.to);
      if (!fromEl || !toEl) return;

      const fromPort = fromEl.querySelector('.node-port.output');
      const toPort = toEl.querySelector('.node-port.input');
      if (!fromPort || !toPort) return;

      const canvasRect = this.canvas.getBoundingClientRect();
      const fromRect = fromPort.getBoundingClientRect();
      const toRect = toPort.getBoundingClientRect();

      const x1 = fromRect.left + fromRect.width / 2 - canvasRect.left + this.canvas.scrollLeft;
      const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top + this.canvas.scrollTop;
      const x2 = toRect.left + toRect.width / 2 - canvasRect.left + this.canvas.scrollLeft;
      const y2 = toRect.top + toRect.height / 2 - canvasRect.top + this.canvas.scrollTop;

      const dx = Math.abs(x2 - x1) * 0.5;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`);
      path.classList.add('connection-path');
      path.dataset.connId = conn.id;

      // Click to delete connection
      path.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.connections = this.connections.filter(c => c.id !== conn.id);
        this.drawConnections();
        this.saveWorkflow();
        Toast.show('Connection removed.', 'info');
      });

      svg.appendChild(path);
    });
  },

  /**
   * Handle mouse down on a node (begin drag)
   */
  onNodeMouseDown(e, node) {
    if (e.target.classList.contains('node-port')) return;
    e.stopPropagation();
    e.preventDefault();

    this.selectedNodeId = node.id;
    this.isDragging = true;
    this.dragNode = node;

    const el = document.getElementById('node-' + node.id);
    const rect = el.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;

    this.renderCanvas();
  },

  /**
   * Handle mouse down on a port (begin connection)
   */
  onPortMouseDown(e, nodeId, portType) {
    e.stopPropagation();
    e.preventDefault();
    this.isConnecting = true;
    this.connectFromNodeId = nodeId;
    this.connectFromPort = portType;
  },

  /**
   * Handle mouse move globally
   */
  onMouseMove(e) {
    if (this.isDragging && this.dragNode) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left + this.canvas.scrollLeft - this.dragOffsetX;
      const y = e.clientY - rect.top + this.canvas.scrollTop - this.dragOffsetY;

      this.dragNode.x = Math.max(0, x);
      this.dragNode.y = Math.max(0, y);

      const el = document.getElementById('node-' + this.dragNode.id);
      if (el) {
        el.style.left = this.dragNode.x + 'px';
        el.style.top = this.dragNode.y + 'px';
      }
      this.drawConnections();
    }

    if (this.isConnecting) {
      this.drawConnections();
    }
  },

  /**
   * Handle mouse up globally (end drag or connection)
   */
  onMouseUp(e) {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragNode = null;
      this.saveWorkflow();
    }

    if (this.isConnecting) {
      this.isConnecting = false;

      // Find target node under cursor
      const targetEl = document.elementFromPoint(e.clientX, e.clientY);
      const targetNodeEl = targetEl?.closest('.canvas-node');
      const targetPort = targetEl?.closest('.node-port');

      if (targetNodeEl && targetPort && targetPort.dataset.port === 'input') {
        const targetNodeId = targetNodeEl.dataset.nodeId;
        if (this.connectFromPort === 'output') {
          this.addConnection(this.connectFromNodeId, targetNodeId);
        }
      }

      this.connectFromNodeId = null;
      this.connectFromPort = null;
      this.drawConnections();
    }
  },

  /**
   * Open node configuration modal
   */
  openNodeConfig(node) {
    this.nodeConfigTitle.textContent = `Configure: ${this.getNodeLabel(node.type)}`;
    const config = node.config || {};
    const fields = this.getNodeConfigFields(node.type, config);

    this.nodeConfigBody.innerHTML = `
      <input type="hidden" id="configNodeId" value="${node.id}" />
      ${fields}
    `;

    this.nodeConfigModal.classList.add('active');
  },

  /**
   * Get configuration form fields for each node type
   */
  getNodeConfigFields(type, config) {
    const base = '<div class="form-group"><label>Description</label><input type="text" id="cfg_desc" value="' + (config.description || '') + '" placeholder="Brief description" /></div>';

    switch (type) {
      case 'webhook':
        return base + `
          <div class="form-group"><label>Webhook URL (auto-generated)</label><input type="text" value="https://hook.aiflow.io/wh_${Date.now()}" readonly /></div>
          <div class="form-group"><label>HTTP Method</label><select id="cfg_method"><option ${config.method === 'POST' ? 'selected' : ''}>POST</option><option ${config.method === 'GET' ? 'selected' : ''}>GET</option></select></div>
          <div class="form-group"><label>Response Template</label><textarea id="cfg_response" rows="3">${config.response || '{"status":"ok"}'}</textarea></div>
        `;

      case 'schedule':
        return base + `
          <div class="form-group"><label>Cron Expression</label><input type="text" id="cfg_cron" value="${config.cron || '0 9 * * *'}" placeholder="0 9 * * *" /></div>
          <div class="form-group"><label>Timezone</label><select id="cfg_timezone"><option>UTC</option><option>Asia/Shanghai</option><option>America/New_York</option><option>Europe/London</option></select></div>
        `;

      case 'ai-agent':
        return base + `
          <div class="form-group"><label>AI Prompt</label><textarea id="cfg_prompt" rows="4" placeholder="Ask the AI agent...">${config.prompt || ''}</textarea></div>
          <div class="form-group"><label>Model</label><select id="cfg_model"><option>gemini-2.0-flash</option><option>gemini-2.0-pro</option><option>gemini-1.5-pro</option><option>gemini-1.5-flash</option></select></div>
          <div class="form-group"><label>Output Variable Name</label><input type="text" id="cfg_output" value="${config.output || 'ai_response'}" /></div>
        `;

      case 'ai-chat':
        return base + `
          <div class="form-group"><label>System Message</label><textarea id="cfg_system" rows="3">${config.system || 'You are a helpful assistant.'}</textarea></div>
          <div class="form-group"><label>User Message</label><textarea id="cfg_message" rows="3">${config.message || 'Hello! Tell me something interesting.'}</textarea></div>
          <div class="form-group"><label>Temperature (0-1)</label><input type="number" id="cfg_temp" value="${config.temperature || 0.7}" min="0" max="1" step="0.1" /></div>
        `;

      case 'gmail':
        return base + `
          <div class="form-group"><label>To</label><input type="email" id="cfg_to" value="${config.to || ''}" /></div>
          <div class="form-group"><label>Subject</label><input type="text" id="cfg_subject" value="${config.subject || ''}" /></div>
          <div class="form-group"><label>Body</label><textarea id="cfg_body" rows="4">${config.body || ''}</textarea></div>
        `;

      case 'telegram':
        return base + `
          <div class="form-group"><label>Bot Token</label><input type="password" id="cfg_token" value="${config.token || ''}" /></div>
          <div class="form-group"><label>Chat ID</label><input type="text" id="cfg_chatId" value="${config.chatId || ''}" /></div>
          <div class="form-group"><label>Message</label><textarea id="cfg_text" rows="3">${config.text || ''}</textarea></div>
        `;

      case 'whatsapp':
        return base + `
          <div class="form-group"><label>Phone Number</label><input type="text" id="cfg_phone" value="${config.phone || ''}" placeholder="+1234567890" /></div>
          <div class="form-group"><label>Message</label><textarea id="cfg_text" rows="3">${config.text || ''}</textarea></div>
        `;

      case 'sheets':
        return base + `
          <div class="form-group"><label>Spreadsheet ID</label><input type="text" id="cfg_sheetId" value="${config.sheetId || ''}" /></div>
          <div class="form-group"><label>Range (e.g., Sheet1!A1:D10)</label><input type="text" id="cfg_range" value="${config.range || ''}" /></div>
          <div class="form-group"><label>Operation</label><select id="cfg_operation"><option>Read</option><option>Append</option><option>Update</option></select></div>
        `;

      case 'http-request':
        return base + `
          <div class="form-group"><label>URL</label><input type="text" id="cfg_url" value="${config.url || ''}" /></div>
          <div class="form-group"><label>Method</label><select id="cfg_method"><option ${config.method === 'GET' ? 'selected' : ''}>GET</option><option ${config.method === 'POST' ? 'selected' : ''}>POST</option><option ${config.method === 'PUT' ? 'selected' : ''}>PUT</option><option ${config.method === 'DELETE' ? 'selected' : ''}>DELETE</option></select></div>
          <div class="form-group"><label>Headers (JSON)</label><textarea id="cfg_headers" rows="2">${config.headers || '{}'}</textarea></div>
          <div class="form-group"><label>Body</label><textarea id="cfg_body" rows="3">${config.body || ''}</textarea></div>
        `;

      case 'database':
        return base + `
          <div class="form-group"><label>Connection String</label><input type="text" id="cfg_connStr" value="${config.connStr || ''}" placeholder="mysql://user:pass@host/db" /></div>
          <div class="form-group"><label>SQL Query</label><textarea id="cfg_query" rows="4">${config.query || 'SELECT * FROM users'}</textarea></div>
        `;

      case 'condition':
        return base + `
          <div class="form-group"><label>Left Value</label><input type="text" id="cfg_left" value="${config.left || ''}" placeholder="{{variable}}" /></div>
          <div class="form-group"><label>Operator</label><select id="cfg_operator"><option>equals</option><option>not equals</option><option>contains</option><option>greater than</option><option>less than</option></select></div>
          <div class="form-group"><label>Right Value</label><input type="text" id="cfg_right" value="${config.right || ''}" /></div>
        `;

      case 'loop':
        return base + `
          <div class="form-group"><label>Iterate Over (JSON array)</label><textarea id="cfg_items" rows="3">${config.items || '[]'}</textarea></div>
          <div class="form-group"><label>Max Iterations</label><input type="number" id="cfg_maxIter" value="${config.maxIter || 10}" /></div>
        `;

      default:
        return base;
    }
  },

  /**
   * Save node configuration from modal
   */
  saveNodeConfig() {
    const nodeId = document.getElementById('configNodeId').value;
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Collect all config fields dynamically
    const config = {};
    this.nodeConfigBody.querySelectorAll('input, textarea, select').forEach(field => {
      if (field.id && field.id.startsWith('cfg_')) {
        const key = field.id.replace('cfg_', '');
        config[key] = field.value;
      }
    });

    node.config = config;
    this.closeModal();
    this.renderCanvas();
    this.saveWorkflow();
    Toast.show('Node configuration saved.', 'success');
  },

  /**
   * Close the config modal
   */
  closeModal() {
    this.nodeConfigModal.classList.remove('active');
  },

  /**
   * Save current state to storage
   */
  saveWorkflow(silent = false) {
    if (!this.workflow) return;

    this.workflow.name = this.nameInput.value || 'Untitled Workflow';
    this.workflow.nodes = this.nodes;
    this.workflow.connections = this.connections;
    this.workflow.updatedAt = new Date().toISOString();
    Storage.saveWorkflow(this.workflow);

    if (!silent) {
      Toast.show('Workflow saved.', 'success');
    }
  },

  /**
   * Execute the current workflow
   */
  async executeWorkflow() {
    if (!this.workflow || this.nodes.length === 0) {
      Toast.show('Add nodes to the workflow first.', 'warning');
      return;
    }

    this.saveWorkflow(true);

    // Mark all nodes as running
    this.canvas.querySelectorAll('.canvas-node').forEach(el => el.classList.add('running'));
    Toast.show('Executing workflow...', 'info');

    const startTime = Date.now();
    let status = 'success';

    try {
      // Process nodes in order (topological sort by connections)
      const executed = new Set();
      const queue = [...this.nodes.filter(n =>
        !this.connections.some(c => c.to === n.id)
      )];

      while (queue.length > 0) {
        const node = queue.shift();
        if (executed.has(node.id)) continue;

        // Simulate node execution
        const el = document.getElementById('node-' + node.id);
        if (el) el.classList.add('running');

        await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

        // Execute AI nodes with Gemini API
        if (node.type === 'ai-agent' || node.type === 'ai-chat') {
          const config = Storage.getAgentConfig();
          if (config?.apiKey) {
            try {
              const prompt = node.config?.prompt || node.config?.message || 'Hello';
              const model = node.config?.model || config.model || 'gemini-2.0-flash';
              const temp = parseFloat(node.config?.temperature || config.temperature || 0.7);
              await GeminiAPI.generate(prompt, model, temp);
            } catch (e) {
              if (el) el.classList.add('error');
              status = 'failed';
            }
          } else {
            // Fallback: simulate AI response
            if (el) {
              // Brief running state then success
              await new Promise(r => setTimeout(r, 200));
            }
          }
        }

        executed.add(node.id);
        if (el) {
          el.classList.remove('running');
        }

        // Queue downstream nodes
        this.connections
          .filter(c => c.from === node.id)
          .forEach(c => {
            const next = this.nodes.find(n => n.id === c.to);
            if (next && !executed.has(next.id)) {
              queue.push(next);
            }
          });
      }

      const duration = Date.now() - startTime;

      Storage.addHistory({
        workflowId: this.workflow.id,
        workflowName: this.workflow.name,
        status: status,
        duration,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString()
      });

      Toast.show(
        status === 'success' ? `Workflow completed in ${duration}ms` : 'Workflow completed with errors',
        status === 'success' ? 'success' : 'error'
      );
    } catch (e) {
      status = 'failed';
      Storage.addHistory({
        workflowId: this.workflow.id,
        workflowName: this.workflow.name,
        status: 'failed',
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString()
      });
      Toast.show('Workflow execution failed: ' + e.message, 'error');
    }

    // Clean up
    this.canvas.querySelectorAll('.canvas-node').forEach(el => {
      el.classList.remove('running', 'error');
    });

    History.render();
  },

  /**
   * Export workflow as JSON
   */
  exportWorkflow() {
    if (!this.workflow) {
      Toast.show('No workflow to export.', 'warning');
      return;
    }
    this.saveWorkflow(true);
    const json = JSON.stringify(this.workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (this.workflow.name || 'workflow').replace(/\s+/g, '_') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Workflow exported!', 'success');
  },

  /**
   * Show import modal
   */
  showImportModal() {
    const modal = document.getElementById('importModal');
    modal.classList.add('active');

    document.getElementById('importModalClose').onclick = () => modal.classList.remove('active');
    document.getElementById('importCancel').onclick = () => modal.classList.remove('active');
    document.getElementById('importConfirm').onclick = () => {
      const json = document.getElementById('importJson').value.trim();
      try {
        const imported = JSON.parse(json);
        if (!imported.nodes) throw new Error('Invalid workflow format');
        imported.id = 'wf_' + Date.now();
        imported.createdAt = new Date().toISOString();
        imported.updatedAt = new Date().toISOString();
        Storage.saveWorkflow(imported);
        modal.classList.remove('active');
        document.getElementById('importJson').value = '';
        this.loadWorkflow(imported.id);
        Workflows.render();
        Toast.show('Workflow imported!', 'success');
      } catch (e) {
        Toast.show('Invalid JSON: ' + e.message, 'error');
      }
    };
  },

  /**
   * Get node icon info
   */
  getNodeIcon(type) {
    const map = {
      'webhook': { emoji: '⚡', color: '#8B5CF6' },
      'schedule': { emoji: '🕐', color: '#F59E0B' },
      'ai-agent': { emoji: '🧠', color: '#6366F1' },
      'ai-chat': { emoji: '💬', color: '#EC4899' },
      'gmail': { emoji: '📧', color: '#EA4335' },
      'telegram': { emoji: '📨', color: '#26A5E4' },
      'whatsapp': { emoji: '💚', color: '#25D366' },
      'sheets': { emoji: '📊', color: '#34A853' },
      'http-request': { emoji: '🌐', color: '#06B6D4' },
      'database': { emoji: '🗄️', color: '#78716C' },
      'condition': { emoji: '🔀', color: '#F97316' },
      'loop': { emoji: '🔁', color: '#14B8A6' }
    };
    return map[type] || { emoji: '📦', color: '#94A3B8' };
  },

  /**
   * Get human-readable node label
   */
  getNodeLabel(type) {
    const map = {
      'webhook': 'Webhook',
      'schedule': 'Schedule',
      'ai-agent': 'AI Agent',
      'ai-chat': 'AI Chat',
      'gmail': 'Gmail',
      'telegram': 'Telegram',
      'whatsapp': 'WhatsApp',
      'sheets': 'Google Sheets',
      'http-request': 'HTTP Request',
      'database': 'Database',
      'condition': 'Condition',
      'loop': 'Loop'
    };
    return map[type] || type;
  },

  /**
   * Get default description for a node type
   */
  getDefaultDesc(type) {
    const map = {
      'webhook': 'Receive HTTP requests',
      'schedule': 'Run on a schedule',
      'ai-agent': 'AI-powered automation',
      'ai-chat': 'AI conversation node',
      'gmail': 'Send email via Gmail',
      'telegram': 'Send Telegram messages',
      'whatsapp': 'Send WhatsApp messages',
      'sheets': 'Read/write Google Sheets',
      'http-request': 'Make HTTP API calls',
      'database': 'Query databases',
      'condition': 'Branch by condition',
      'loop': 'Loop over items'
    };
    return map[type] || 'Configure this node';
  }
};
