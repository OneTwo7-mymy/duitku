/* ============================================
   DuitKu - Main App Controller
   ============================================ */

const App = {
    currentPage: 'dashboard',

    // Initialize the app
    init() {
        console.log('DuitKu App initialized');

        // Initialize all modules
        Expenses.init();
        Budget.init();
        Tabung.init();
        Investment.init();
        Reports.init();
        Sharing.init();

        // Setup event listeners
        this.setupNavigation();
        this.setupModeToggle();

        // Update dashboard
        this.updateDashboard();

        // Initialize Google Drive
        GDrive.init();
    },

    // Setup navigation
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    // Navigate to page
    navigateTo(page) {
        this.currentPage = page;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`page-${page}`).classList.add('active');

        // Show/hide FAB
        const fab = document.getElementById('fab-add');
        if (page === 'expenses' || page === 'dashboard') {
            fab.classList.remove('hidden');
        } else {
            fab.classList.add('hidden');
        }

        // Refresh charts when navigating to reports
        if (page === 'reports') {
            Reports.refresh();
        }

        // Refresh specific modules
        if (page === 'budget') Budget.render();
        if (page === 'tabung') Tabung.render();
        if (page === 'investment') Investment.render();
        if (page === 'settings') Sharing.renderCollaborators();
    },

    // Setup mode toggle (Personal/Family)
    setupModeToggle() {
        const currentMode = Storage.getMode();
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === currentMode) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                Storage.setMode(mode);

                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Refresh all modules
                this.refreshAll();
            });
        });
    },

    // Refresh all modules
    refreshAll() {
        Expenses.render();
        Expenses.loadSalary();
        Budget.render();
        Tabung.render();
        Investment.render();
        Reports.refresh();
        this.updateDashboard();
    },

    // Update dashboard summary
    updateDashboard() {
        const currentMonth = Expenses.getCurrentMonth();

        // Get salary
        const salary = Storage.getSalary(currentMonth);
        document.getElementById('monthly-salary').textContent = `RM ${salary.toFixed(2)}`;

        // Get total expenses
        const totalExpenses = Expenses.getMonthlyTotal(currentMonth);
        document.getElementById('monthly-expenses').textContent = `RM ${totalExpenses.toFixed(2)}`;

        // Calculate balance
        const balance = salary - totalExpenses;
        document.getElementById('monthly-balance').textContent = `RM ${balance.toFixed(2)}`;

        // Get total tabung
        const totalTabung = Tabung.getTotalSavings();
        document.getElementById('total-tabung').textContent = `RM ${totalTabung.toFixed(2)}`;

        // Get total investment
        const totalInvestment = Investment.getTotalValue();
        document.getElementById('total-investment').textContent = `RM ${totalInvestment.toFixed(2)}`;

        // Render recent transactions
        this.renderRecentTransactions();
    },

    // Render recent transactions on dashboard
    renderRecentTransactions() {
        const expenses = Storage.getExpenses();
        const container = document.getElementById('recent-transactions');

        if (expenses.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📝</div>
          <h3>No transactions yet</h3>
          <p>Start by adding your first expense</p>
        </div>
      `;
            return;
        }

        // Show latest 5 transactions
        const recent = expenses.slice(0, 5);
        const categoryIcons = {
            food: '🍔',
            transport: '🚗',
            shopping: '🛒',
            bills: '🏠',
            entertainment: '🎮',
            health: '💊',
            education: '📚',
            others: '➕'
        };

        container.innerHTML = recent.map(expense => `
      <div class="transaction-item" onclick="navigateTo('expenses')">
        <div class="transaction-icon">${categoryIcons[expense.category] || '💰'}</div>
        <div class="transaction-details">
          <p class="transaction-title">${expense.note || expense.category}</p>
          <p class="transaction-category">${expense.date}</p>
        </div>
        <p class="transaction-amount">-RM ${parseFloat(expense.amount).toFixed(2)}</p>
      </div>
    `).join('');
    }
};

// ============================================
// Modal Functions
// ============================================

function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// ============================================
// Global Navigation
// ============================================

function navigateTo(page) {
    App.navigateTo(page);
}

// ============================================
// Keyboard Shortcuts
// ============================================

document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// ============================================
// Service Worker Registration
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker not registered:', err));
    });
}
