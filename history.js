/**
 * AI Flow — History Module
 * Manages workflow execution history display.
 */

const History = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
      if (confirm('Clear all run history? This cannot be undone.')) {
        Storage.clearHistory();
        this.render();
        Toast.show('History cleared.', 'info');
      }
    });

    document.getElementById('historyStatusFilter').addEventListener('change', () => this.render());
  },

  /**
   * Render history table
   */
  render() {
    const tbody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('emptyHistory');
    const filter = document.getElementById('historyStatusFilter').value;

    let entries = Storage.getHistory();
    if (filter !== 'all') {
      entries = entries.filter(e => e.status === filter);
    }

    tbody.innerHTML = '';

    if (entries.length === 0) {
      emptyState.style.display = 'flex';
      document.querySelector('#view-history .history-table-wrapper').style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    document.querySelector('#view-history .history-table-wrapper').style.display = 'block';

    entries.forEach(entry => {
      const tr = document.createElement('tr');

      const statusClass = entry.status === 'success' ? 'success' :
                          entry.status === 'failed' ? 'failed' : 'running';

      tr.innerHTML = `
        <td>${this.escape(entry.workflowName || 'Untitled')}</td>
        <td><span class="status-badge ${statusClass}">${entry.status}</span></td>
        <td>${this.formatDate(entry.startedAt || entry.timestamp)}</td>
        <td>${entry.duration ? entry.duration + 'ms' : '—'}</td>
        <td>
          <button class="btn btn-sm btn-outline view-run" data-id="${entry.id}">View</button>
          <button class="btn btn-sm btn-danger delete-run" data-id="${entry.id}">Delete</button>
        </td>
      `;

      tr.querySelector('.delete-run').addEventListener('click', () => {
        this.deleteEntry(entry.id);
      });

      tr.querySelector('.view-run').addEventListener('click', () => {
        this.viewEntry(entry);
      });

      tbody.appendChild(tr);
    });
  },

  /**
   * Delete a single history entry
   */
  deleteEntry(id) {
    const history = Storage.getHistory().filter(h => h.id !== id);
    localStorage.setItem(Storage.userKey('history'), JSON.stringify(history));
    this.render();
    Toast.show('Entry deleted.', 'info');
  },

  /**
   * View a history entry
   */
  viewEntry(entry) {
    const details = [
      `Workflow: ${entry.workflowName || 'Untitled'}`,
      `Status: ${entry.status}`,
      `Started: ${this.formatDate(entry.startedAt || entry.timestamp)}`,
      `Duration: ${entry.duration ? entry.duration + 'ms' : 'N/A'}`,
      entry.completedAt ? `Completed: ${this.formatDate(entry.completedAt)}` : '',
      `ID: ${entry.id}`
    ].filter(Boolean).join('\n');
    alert(details);
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
};
