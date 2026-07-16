/**
 * AI Flow — Toast Notification Module
 * Lightweight toast notification system.
 */

const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toastContainer');
  },

  /**
   * Show a toast notification
   * @param {string} message - The notification text
   * @param {'success'|'error'|'info'|'warning'} type - Notification type
   * @param {number} duration - Duration in ms (default 3500)
   */
  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('exiting');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }
};
