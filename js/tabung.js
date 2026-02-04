/* ============================================
   DuitKu - Tabung (Savings) Module
   ============================================ */

const Tabung = {
    // Initialize
    init() {
        this.render();
    },

    // Render tabung list
    render() {
        const tabung = Storage.getTabung();
        const container = document.getElementById('tabung-list');

        if (tabung.length === 0) {
            container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="icon">🎯</div>
          <h3>No savings goals</h3>
          <p>Create your first tabung to start saving!</p>
        </div>
      `;
            return;
        }

        container.innerHTML = tabung.map(goal => this.renderTabungCard(goal)).join('');
    },

    // Render single tabung card
    renderTabungCard(goal) {
        const current = parseFloat(goal.current) || 0;
        const target = parseFloat(goal.target);
        const percentage = Math.min((current / target) * 100, 100);
        const remaining = target - current;

        // Days until deadline
        const deadline = new Date(goal.deadline);
        const today = new Date();
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        // Check if goal is completed
        const isCompleted = current >= target;

        return `
      <div class="card ${isCompleted ? 'summary-card success' : ''}">
        <div class="flex justify-between items-start mb-md">
          <div>
            <h4 class="font-semibold">${goal.name}</h4>
            <p class="text-sm text-muted">${daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}</p>
          </div>
          <div class="flex gap-xs">
            <button class="btn btn-ghost btn-sm" onclick="Tabung.openAddMoneyModal('${goal.id}')">💰</button>
            <button class="btn btn-ghost btn-sm" onclick="Tabung.delete('${goal.id}')">🗑️</button>
          </div>
        </div>
        
        <div class="flex justify-center mb-md">
          <div class="progress-ring">
            <svg width="120" height="120">
              <defs>
                <linearGradient id="gradient-${goal.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:${isCompleted ? '#22c55e' : '#6366f1'}"/>
                  <stop offset="100%" style="stop-color:${isCompleted ? '#10b981' : '#8b5cf6'}"/>
                </linearGradient>
              </defs>
              <circle class="bg" cx="60" cy="60" r="52" fill="none" stroke="rgba(148, 163, 184, 0.2)" stroke-width="12"/>
              <circle class="progress" cx="60" cy="60" r="52" fill="none" stroke="url(#gradient-${goal.id})" stroke-width="12"
                stroke-dasharray="${2 * Math.PI * 52}"
                stroke-dashoffset="${2 * Math.PI * 52 * (1 - percentage / 100)}"
                style="transform: rotate(-90deg); transform-origin: center;"/>
            </svg>
            <div class="value">
              <p class="text-xl font-bold">${percentage.toFixed(0)}%</p>
              <p class="text-xs text-muted">${isCompleted ? '🎉 Done!' : 'Progress'}</p>
            </div>
          </div>
        </div>
        
        <div class="text-center">
          <p class="font-mono font-bold">RM ${current.toFixed(2)}</p>
          <p class="text-sm text-muted">of RM ${target.toFixed(2)}</p>
          ${!isCompleted ? `<p class="text-sm text-muted mt-sm">RM ${remaining.toFixed(2)} more to go</p>` : ''}
          ${isCompleted && daysLeft > 0 ? `<p class="text-sm text-success mt-sm">🎁 Completed ${daysLeft} days early!</p>` : ''}
        </div>
      </div>
    `;
    },

    // Set tabung name from suggestion
    setName(name) {
        document.getElementById('tabung-name').value = name;
    },

    // Open tabung modal
    openModal() {
        document.getElementById('tabung-id').value = '';
        document.getElementById('tabung-name').value = '';
        document.getElementById('tabung-target').value = '';

        // Set default deadline to 1 year from now
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        document.getElementById('tabung-deadline').value = nextYear.toISOString().split('T')[0];
        document.getElementById('tabung-calendar').checked = true;

        openModal('tabung-modal');
    },

    // Save tabung
    async save() {
        const id = document.getElementById('tabung-id').value;
        const name = document.getElementById('tabung-name').value.trim();
        const target = parseFloat(document.getElementById('tabung-target').value);
        const deadline = document.getElementById('tabung-deadline').value;
        const addToCalendar = document.getElementById('tabung-calendar').checked;

        if (!name) {
            alert('Please enter a goal name');
            return;
        }

        if (!target || target <= 0) {
            alert('Please enter a valid target amount');
            return;
        }

        if (!deadline) {
            alert('Please select a target date');
            return;
        }

        const tabungData = {
            name,
            target,
            deadline
        };

        let goal;
        if (id) {
            goal = Storage.updateTabung(id, tabungData);
        } else {
            goal = Storage.addTabung(tabungData);
        }

        // Add to Google Calendar if requested
        if (addToCalendar && goal) {
            await this.addToGoogleCalendar(goal);
        }

        closeModal('tabung-modal');
        this.render();
        this.updateDashboard();
    },

    // Add goal deadline to Google Calendar
    async addToGoogleCalendar(goal) {
        const token = await Auth.getToken();
        if (!token) {
            console.log('No token for Calendar');
            return;
        }

        try {
            const event = {
                summary: `🎯 Tabung Goal: ${goal.name}`,
                description: `Target: RM ${goal.target}\n\nDuitKu Savings Goal`,
                start: {
                    date: goal.deadline
                },
                end: {
                    date: goal.deadline
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'popup', minutes: 60 * 24 * 7 }, // 1 week before
                        { method: 'popup', minutes: 60 * 24 }      // 1 day before
                    ]
                }
            };

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (response.ok) {
                console.log('Calendar event created');
            }
        } catch (error) {
            console.error('Calendar error:', error);
        }
    },

    // Open add money modal
    openAddMoneyModal(id) {
        document.getElementById('tabung-add-id').value = id;
        document.getElementById('tabung-add-amount').value = '';
        openModal('tabung-add-modal');
    },

    // Add or withdraw money
    addMoney(type) {
        const id = document.getElementById('tabung-add-id').value;
        const amount = parseFloat(document.getElementById('tabung-add-amount').value);

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const goal = Storage.addToTabung(id, amount, type);

        closeModal('tabung-add-modal');
        this.render();
        this.updateDashboard();

        // Check if goal is completed
        if (goal && goal.current >= goal.target) {
            const deadline = new Date(goal.deadline);
            const today = new Date();
            const daysEarly = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

            if (daysEarly > 0) {
                setTimeout(() => {
                    alert(`🎉 Congratulations!\n\nYou've completed "${goal.name}" ${daysEarly} days early!\n\nTreat yourself to something nice! 🎁`);
                }, 500);
            } else {
                setTimeout(() => {
                    alert(`🎉 Goal Completed!\n\nYou've reached your target for "${goal.name}"!`);
                }, 500);
            }
        }
    },

    // Delete tabung
    delete(id) {
        if (confirm('Delete this savings goal?')) {
            Storage.deleteTabung(id);
            this.render();
            this.updateDashboard();
        }
    },

    // Get total savings
    getTotalSavings() {
        const tabung = Storage.getTabung();
        return tabung.reduce((sum, t) => sum + parseFloat(t.current || 0), 0);
    },

    // Update dashboard
    updateDashboard() {
        if (typeof App !== 'undefined') {
            App.updateDashboard();
        }
    }
};

// Global functions
function openTabungModal() {
    Tabung.openModal();
}

function saveTabung() {
    Tabung.save();
}

function setTabungName(name) {
    Tabung.setName(name);
}

function addToTabung(type) {
    Tabung.addMoney(type);
}
