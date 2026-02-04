/* ============================================
   DuitKu - Reports & Analytics
   ============================================ */

const Reports = {
    charts: {},

    // Initialize
    init() {
        this.updateNetWorth();
        this.renderExpensePieChart();
        this.renderSpendingTrendChart();
        this.renderInvestmentChart();
    },

    // Update net worth
    updateNetWorth() {
        const tabungTotal = Tabung.getTotalSavings();
        const investmentTotal = Investment.getTotalValue();
        const netWorth = tabungTotal + investmentTotal;

        document.getElementById('net-worth').textContent = `RM ${netWorth.toFixed(2)}`;
    },

    // Render expense pie chart
    renderExpensePieChart() {
        const ctx = document.getElementById('expense-pie-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.expensePie) {
            this.charts.expensePie.destroy();
        }

        const breakdown = Expenses.getCategoryBreakdown();
        const categories = Object.keys(breakdown);
        const values = Object.values(breakdown);

        if (categories.length === 0) {
            ctx.parentElement.innerHTML = '<p class="text-center text-muted p-lg">No expense data</p>';
            return;
        }

        const categoryColors = {
            food: '#ef4444',
            transport: '#f59e0b',
            shopping: '#8b5cf6',
            bills: '#06b6d4',
            entertainment: '#ec4899',
            health: '#22c55e',
            education: '#3b82f6',
            others: '#94a3b8'
        };

        this.charts.expensePie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
                datasets: [{
                    data: values,
                    backgroundColor: categories.map(c => categoryColors[c] || '#94a3b8'),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    },

    // Render spending trend chart
    renderSpendingTrendChart() {
        const ctx = document.getElementById('spending-trend-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.spendingTrend) {
            this.charts.spendingTrend.destroy();
        }

        // Get last 6 months of data
        const months = [];
        const values = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push(date.toLocaleDateString('en-MY', { month: 'short' }));

            const expenses = Storage.getExpenses(monthStr);
            const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            values.push(total);
        }

        this.charts.spendingTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Expenses (RM)',
                    data: values,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: (value) => 'RM ' + value
                        }
                    }
                }
            }
        });
    },

    // Render investment chart
    renderInvestmentChart() {
        const ctx = document.getElementById('investment-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.investment) {
            this.charts.investment.destroy();
        }

        const breakdown = Investment.getBreakdown();
        const types = Object.keys(breakdown);
        const values = Object.values(breakdown);

        if (types.length === 0) {
            ctx.parentElement.innerHTML = '<p class="text-center text-muted p-lg">No investment data</p>';
            return;
        }

        const typeColors = {
            'stocks': '#ef4444',
            'asb': '#22c55e',
            'unit-trust': '#3b82f6',
            'gold': '#f59e0b',
            'fd': '#8b5cf6',
            'crypto': '#06b6d4',
            'property': '#ec4899',
            'forex': '#14b8a6'
        };

        const typeNames = Investment.typeNames;

        this.charts.investment = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: types.map(t => typeNames[t] || t),
                datasets: [{
                    label: 'Value (RM)',
                    data: values,
                    backgroundColor: types.map(t => typeColors[t] || '#94a3b8'),
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: (value) => 'RM ' + value
                        }
                    }
                }
            }
        });
    },

    // Refresh all charts
    refresh() {
        this.updateNetWorth();
        this.renderExpensePieChart();
        this.renderSpendingTrendChart();
        this.renderInvestmentChart();
    }
};
