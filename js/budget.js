/* ============================================
   DuitKu - Budget Module
   ============================================ */

const Budget = {
    // Initialize
    init() {
        this.render();
    },

    // Render budget list
    render() {
        const budgets = Storage.getBudgets();
        const container = document.getElementById('budget-list');

        if (budgets.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📊</div>
          <h3>No budgets set</h3>
          <p>Set monthly spending limits for each category</p>
        </div>
      `;
            return;
        }

        const currentMonth = Expenses.getCurrentMonth();

        container.innerHTML = `
      <div class="grid grid-2">
        ${budgets.map(budget => this.renderBudgetCard(budget, currentMonth)).join('')}
      </div>
    `;
    },

    // Render single budget card
    renderBudgetCard(budget, month) {
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

        // Get spent amount for this category
        const expenses = Storage.getExpenses(month);
        const spent = expenses
            .filter(e => e.category === budget.category)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const limit = parseFloat(budget.limit);
        const percentage = Math.min((spent / limit) * 100, 100);
        const remaining = limit - spent;

        // Determine status
        let statusClass = '';
        let statusText = '';
        if (percentage >= 100) {
            statusClass = 'danger';
            statusText = '⚠️ Over budget!';
        } else if (percentage >= 80) {
            statusClass = 'warning';
            statusText = '⚠️ Almost limit';
        } else {
            statusClass = 'success';
            statusText = '✅ On track';
        }

        return `
      <div class="card">
        <div class="flex justify-between items-center mb-md">
          <div class="flex items-center gap-sm">
            <span style="font-size: 1.5rem;">${categoryIcons[budget.category] || '💰'}</span>
            <span class="font-semibold" style="text-transform: capitalize;">${budget.category}</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Budget.delete('${budget.id}')">✕</button>
        </div>
        
        <div class="mb-sm">
          <div class="flex justify-between text-sm mb-xs">
            <span class="text-muted">Spent</span>
            <span class="font-mono">RM ${spent.toFixed(2)} / ${limit.toFixed(2)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${statusClass}" style="width: ${percentage}%;"></div>
          </div>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm ${remaining < 0 ? 'text-danger' : 'text-success'}">
            ${remaining >= 0 ? `RM ${remaining.toFixed(2)} left` : `RM ${Math.abs(remaining).toFixed(2)} over`}
          </span>
          <span class="text-sm text-muted">${statusText}</span>
        </div>
      </div>
    `;
    },

    // Open budget modal
    openModal() {
        document.getElementById('budget-category').value = 'food';
        document.getElementById('budget-limit').value = '';
        openModal('budget-modal');
    },

    // Save budget
    save() {
        const category = document.getElementById('budget-category').value;
        const limit = parseFloat(document.getElementById('budget-limit').value);

        if (!limit || limit <= 0) {
            alert('Please enter a valid budget limit');
            return;
        }

        Storage.addBudget({
            category,
            limit
        });

        closeModal('budget-modal');
        this.render();
    },

    // Delete budget
    delete(id) {
        if (confirm('Delete this budget?')) {
            Storage.deleteBudget(id);
            this.render();
        }
    },

    // Check budget warnings
    checkWarnings() {
        const budgets = Storage.getBudgets();
        const currentMonth = Expenses.getCurrentMonth();
        const warnings = [];

        budgets.forEach(budget => {
            const expenses = Storage.getExpenses(currentMonth);
            const spent = expenses
                .filter(e => e.category === budget.category)
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);

            const percentage = (spent / budget.limit) * 100;

            if (percentage >= 100) {
                warnings.push({
                    category: budget.category,
                    type: 'over',
                    message: `You've exceeded your ${budget.category} budget!`
                });
            } else if (percentage >= 80) {
                warnings.push({
                    category: budget.category,
                    type: 'warning',
                    message: `You're close to your ${budget.category} budget limit`
                });
            }
        });

        return warnings;
    }
};

// Global functions
function openBudgetModal() {
    Budget.openModal();
}

function saveBudget() {
    Budget.save();
}
