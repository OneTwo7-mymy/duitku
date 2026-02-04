/* ============================================
   DuitKu - Investment Module
   ============================================ */

const Investment = {
    typeIcons: {
        'stocks': '📊',
        'asb': '🏦',
        'unit-trust': '📈',
        'gold': '🪙',
        'fd': '💰',
        'crypto': '🔷',
        'property': '🏠',
        'forex': '💱'
    },

    typeNames: {
        'stocks': 'Stocks (Bursa)',
        'asb': 'ASB/ASM',
        'unit-trust': 'Unit Trust',
        'gold': 'Gold',
        'fd': 'Fixed Deposit',
        'crypto': 'Crypto',
        'property': 'Property',
        'forex': 'Forex'
    },

    // Initialize
    init() {
        this.render();
    },

    // Render investments
    render() {
        const investments = Storage.getInvestments();
        const container = document.getElementById('investment-list');

        // Update summary cards
        this.updateSummary();

        if (investments.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📊</div>
          <h3>No investments yet</h3>
          <p>Start tracking your investment portfolio</p>
        </div>
      `;
            return;
        }

        container.innerHTML = investments.map(inv => this.renderInvestmentItem(inv)).join('');
    },

    // Render single investment item
    renderInvestmentItem(inv) {
        const buyPrice = parseFloat(inv.buyPrice);
        const currentValue = parseFloat(inv.currentValue);
        const profitLoss = currentValue - buyPrice;
        const percentage = ((profitLoss / buyPrice) * 100).toFixed(2);
        const isProfit = profitLoss >= 0;

        return `
      <div class="transaction-item" onclick="Investment.edit('${inv.id}')">
        <div class="transaction-icon">${this.typeIcons[inv.type] || '💰'}</div>
        <div class="transaction-details">
          <p class="transaction-title">${inv.name}</p>
          <p class="transaction-category">${this.typeNames[inv.type] || inv.type}${inv.units ? ` • ${inv.units} units` : ''}</p>
        </div>
        <div class="text-right">
          <p class="font-mono font-semibold">RM ${currentValue.toFixed(2)}</p>
          <p class="text-sm ${isProfit ? 'text-success' : 'text-danger'}">
            ${isProfit ? '+' : ''}${percentage}%
          </p>
        </div>
      </div>
    `;
    },

    // Update summary cards
    updateSummary() {
        const investments = Storage.getInvestments();

        const totalInvested = investments.reduce((sum, i) => sum + parseFloat(i.buyPrice), 0);
        const currentValue = investments.reduce((sum, i) => sum + parseFloat(i.currentValue), 0);
        const profitLoss = currentValue - totalInvested;

        document.getElementById('total-invested').textContent = `RM ${totalInvested.toFixed(2)}`;
        document.getElementById('current-value').textContent = `RM ${currentValue.toFixed(2)}`;
        document.getElementById('profit-loss').textContent = `${profitLoss >= 0 ? '+' : ''}RM ${profitLoss.toFixed(2)}`;

        // Update card color based on profit/loss
        const plCard = document.getElementById('profit-loss-card');
        plCard.classList.remove('success', 'secondary');
        if (profitLoss >= 0) {
            plCard.classList.add('success');
        } else {
            plCard.style.background = 'var(--gradient-danger)';
        }
    },

    // Open investment modal
    openModal() {
        document.getElementById('investment-id').value = '';
        document.getElementById('investment-type').value = 'stocks';
        document.getElementById('investment-name').value = '';
        document.getElementById('investment-buy-price').value = '';
        document.getElementById('investment-current-value').value = '';
        document.getElementById('investment-units').value = '';
        document.getElementById('investment-date').value = new Date().toISOString().split('T')[0];

        openModal('investment-modal');
    },

    // Edit investment
    edit(id) {
        const investments = Storage.getAllInvestments();
        const inv = investments.find(i => i.id === id);
        if (!inv) return;

        document.getElementById('investment-id').value = inv.id;
        document.getElementById('investment-type').value = inv.type;
        document.getElementById('investment-name').value = inv.name;
        document.getElementById('investment-buy-price').value = inv.buyPrice;
        document.getElementById('investment-current-value').value = inv.currentValue;
        document.getElementById('investment-units').value = inv.units || '';
        document.getElementById('investment-date').value = inv.date;

        openModal('investment-modal');
    },

    // Save investment
    save() {
        const id = document.getElementById('investment-id').value;
        const type = document.getElementById('investment-type').value;
        const name = document.getElementById('investment-name').value.trim();
        const buyPrice = parseFloat(document.getElementById('investment-buy-price').value);
        const currentValue = parseFloat(document.getElementById('investment-current-value').value);
        const units = document.getElementById('investment-units').value;
        const date = document.getElementById('investment-date').value;

        if (!name) {
            alert('Please enter an investment name');
            return;
        }

        if (!buyPrice || buyPrice <= 0) {
            alert('Please enter a valid buy price');
            return;
        }

        if (!currentValue || currentValue < 0) {
            alert('Please enter a valid current value');
            return;
        }

        if (!date) {
            alert('Please select a purchase date');
            return;
        }

        const investmentData = {
            type,
            name,
            buyPrice,
            currentValue,
            units: units ? parseFloat(units) : null,
            date
        };

        if (id) {
            Storage.updateInvestment(id, investmentData);
        } else {
            Storage.addInvestment(investmentData);
        }

        closeModal('investment-modal');
        this.render();
        this.updateDashboard();
    },

    // Delete investment
    delete(id) {
        if (confirm('Delete this investment?')) {
            Storage.deleteInvestment(id);
            this.render();
            this.updateDashboard();
        }
    },

    // Get total investment value
    getTotalValue() {
        const investments = Storage.getInvestments();
        return investments.reduce((sum, i) => sum + parseFloat(i.currentValue), 0);
    },

    // Get investment breakdown by type
    getBreakdown() {
        const investments = Storage.getInvestments();
        const breakdown = {};

        investments.forEach(inv => {
            const type = inv.type;
            if (!breakdown[type]) breakdown[type] = 0;
            breakdown[type] += parseFloat(inv.currentValue);
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
function openInvestmentModal() {
    Investment.openModal();
}

function saveInvestment() {
    Investment.save();
}
