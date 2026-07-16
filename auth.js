/**
 * AI Flow — Authentication Module
 * Handles login, registration, session management, and auth UI.
 */

const Auth = {
  init() {
    this.overlay = document.getElementById('authOverlay');
    this.card = document.getElementById('authCard');
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    this.loginError = document.getElementById('loginError');
    this.regError = document.getElementById('regError');
    this.tabs = document.querySelectorAll('.auth-tab');
    this.logoutBtn = document.getElementById('logoutBtn');

    this.bindTabEvents();
    this.bindFormEvents();

    // Check initial session
    const session = Storage.getSession();
    if (session) {
      this.showApp();
    }
  },

  bindTabEvents() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        if (target === 'login') {
          this.loginForm.classList.add('active');
        } else {
          this.registerForm.classList.add('active');
        }
        this.loginError.textContent = '';
        this.regError.textContent = '';
      });
    });
  },

  bindFormEvents() {
    // Login
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPass').value.trim();
      const user = Storage.findUser(email);

      if (!user) {
        this.loginError.textContent = 'No account found with that email.';
        return;
      }
      if (user.password !== pass) {
        this.loginError.textContent = 'Incorrect password.';
        return;
      }

      Storage.saveSession(user);
      this.showApp();
      Toast.show('Welcome back, ' + user.name + '!', 'success');
    });

    // Register
    this.registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const pass = document.getElementById('regPass').value.trim();

      if (!name || !email || !pass) {
        this.regError.textContent = 'All fields are required.';
        return;
      }
      if (pass.length < 6) {
        this.regError.textContent = 'Password must be at least 6 characters.';
        return;
      }
      if (Storage.findUser(email)) {
        this.regError.textContent = 'An account with this email already exists.';
        return;
      }

      const user = Storage.addUser(name, email, pass);
      Storage.saveSession(user);
      this.showApp();
      Toast.show('Account created! Welcome, ' + user.name + '!', 'success');
    });

    // Logout
    this.logoutBtn.addEventListener('click', () => {
      Storage.clearSession();
      this.hideApp();
      Toast.show('Signed out successfully.', 'info');
    });
  },

  showApp() {
    this.overlay.classList.add('hidden');
    document.getElementById('appContainer').classList.add('visible');
    document.getElementById('userBadge').textContent = Storage.getSession()?.name || '';
  },

  hideApp() {
    this.overlay.classList.remove('hidden');
    document.getElementById('appContainer').classList.remove('visible');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('regName').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPass').value = '';
    this.loginError.textContent = '';
    this.regError.textContent = '';
  },

  isAuthenticated() {
    return Storage.getSession() !== null;
  }
};
