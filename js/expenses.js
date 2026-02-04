/* ============================================
   DuitKu - Expenses Module
   ============================================ */

const Expenses = {
    selectedCategory: 'food',
    currentMonth: null,

    // Initialize
    init() {
        this.currentMonth = this.getCurrentMonth();
        document.getElementById('expense-month').value = this.currentMonth;

        this.setupEventListeners();
        this.render();
        this.loadSalary();
    },

    // Get current month in YYYY-MM format
    getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    // Setup event listeners
    setupEventListeners() {
        // Month selector
        document.getElementById('expense-month').addEventListener('change', (e) => {
            this.currentMonth = e.target.value;
            this.render();
            this.loadSalary();
        });

        // Category selection
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('selected'));
                tag.classList.add('selected');
                this.selectedCategory = tag.dataset.category;
            });
        });

        // Receipt file preview
        document.getElementById('expense-receipt').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('receipt-preview');
                    preview.src = event.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        // Set default date to today
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    },

    // Load salary for current month
    loadSalary() {
        const salary = Storage.getSalary(this.currentMonth);
        document.getElementById('salary-input').value = salary || '';
    },

    // Render expense list
    render() {
        const expenses = Storage.getExpenses(this.currentMonth);
        const container = document.getElementById('expense-list');

        if (expenses.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="icon">💸</div>
          <h3>No expenses yet</h3>
          <p>Tap + to add your first expense</p>
        </div>
      `;
            return;
        }

        // Group by date
        const grouped = this.groupByDate(expenses);

        container.innerHTML = Object.entries(grouped).map(([date, items]) => `
      <div class="transaction-date-group">
        <p class="transaction-date">${this.formatDate(date)}</p>
        ${items.map(expense => this.renderExpenseItem(expense)).join('')}
      </div>
    `).join('');
    },

    // Group expenses by date
    groupByDate(expenses) {
        return expenses.reduce((groups, expense) => {
            const date = expense.date;
            if (!groups[date]) groups[date] = [];
            groups[date].push(expense);
            return groups;
        }, {});
    },

    // Format date for display
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) return 'Today';
        if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

        return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
    },

    // Render single expense item
    renderExpenseItem(expense) {
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

        return `
      <div class="transaction-item" onclick="Expenses.edit('${expense.id}')">
        <div class="transaction-icon">${categoryIcons[expense.category] || '💰'}</div>
        <div class="transaction-details">
          <p class="transaction-title">${expense.note || expense.category}</p>
          <p class="transaction-category">${expense.category}</p>
        </div>
        ${expense.receipt ? '<span class="transaction-receipt">📷</span>' : ''}
        <p class="transaction-amount">-RM ${parseFloat(expense.amount).toFixed(2)}</p>
      </div>
    `;
    },

    // Open modal for new expense
    openModal() {
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('expense-note').value = '';
        document.getElementById('receipt-preview').classList.add('hidden');
        document.getElementById('expense-receipt').value = '';

        // Reset category
        document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('selected'));
        document.querySelector('.category-tag[data-category="food"]').classList.add('selected');
        this.selectedCategory = 'food';

        openModal('expense-modal');
    },

    // Edit existing expense
    edit(id) {
        const expenses = Storage.getAllExpenses();
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;

        document.getElementById('expense-id').value = expense.id;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-note').value = expense.note || '';

        // Set category
        document.querySelectorAll('.category-tag').forEach(t => {
            t.classList.remove('selected');
            if (t.dataset.category === expense.category) {
                t.classList.add('selected');
            }
        });
        this.selectedCategory = expense.category;

        // Show receipt if exists
        if (expense.receipt) {
            const preview = document.getElementById('receipt-preview');
            preview.src = expense.receipt;
            preview.classList.remove('hidden');
        } else {
            document.getElementById('receipt-preview').classList.add('hidden');
        }

        openModal('expense-modal');
    },

    // Save expense
    async save() {
        const id = document.getElementById('expense-id').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const note = document.getElementById('expense-note').value.trim();
        const receiptFile = document.getElementById('expense-receipt').files[0];

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!date) {
            alert('Please select a date');
            return;
        }

        // Get receipt as base64 if uploaded
        let receipt = null;
        if (receiptFile) {
            receipt = await this.fileToBase64(receiptFile);
        } else if (id) {
            // Keep existing receipt when editing
            const existing = Storage.getAllExpenses().find(e => e.id === id);
            receipt = existing?.receipt;
        }

        const expenseData = {
            amount,
            category: this.selectedCategory,
            date,
            note,
            receipt
        };

        if (id) {
            Storage.updateExpense(id, expenseData);
        } else {
            Storage.addExpense(expenseData);
        }

        closeModal('expense-modal');
        this.render();
        this.updateDashboard();
    },

    // Delete expense
    delete(id) {
        if (confirm('Delete this expense?')) {
            Storage.deleteExpense(id);
            this.render();
            this.updateDashboard();
        }
    },

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    },

    // Get monthly totals
    getMonthlyTotal(month = null) {
        const expenses = Storage.getExpenses(month || this.currentMonth);
        return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    },

    // Get category breakdown
    getCategoryBreakdown(month = null) {
        const expenses = Storage.getExpenses(month || this.currentMonth);
        const breakdown = {};

        expenses.forEach(e => {
            if (!breakdown[e.category]) breakdown[e.category] = 0;
            breakdown[e.category] += parseFloat(e.amount);
        });

        return breakdown;
    },

    // Update dashboard
    updateDashboard() {
        if (typeof App !== 'undefined') {
            App.updateDashboard();
        }
    }
};

// Global functions
function openExpenseModal() {
    Expenses.openModal();
}

function saveExpense() {
    Expenses.save();
}

function saveSalary() {
    const amount = parseFloat(document.getElementById('salary-input').value) || 0;
    const month = document.getElementById('expense-month').value;
    Storage.setSalary(month, amount);
    alert('✅ Salary saved!');
    if (typeof App !== 'undefined') {
        App.updateDashboard();
    }
}
