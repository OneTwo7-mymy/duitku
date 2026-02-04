/* ============================================
   DuitKu - LocalStorage Data Management
   ============================================ */

const Storage = {
  KEYS: {
    USER: 'duitku_user',
    SETTINGS: 'duitku_settings',
    EXPENSES: 'duitku_expenses',
    SALARIES: 'duitku_salaries',
    BUDGETS: 'duitku_budgets',
    TABUNG: 'duitku_tabung',
    INVESTMENTS: 'duitku_investments',
    COLLABORATORS: 'duitku_collaborators'
  },

  // Initialize default data
  init() {
    if (!this.get(this.KEYS.SETTINGS)) {
      this.set(this.KEYS.SETTINGS, {
        mode: 'personal',
        currency: 'MYR'
      });
    }
    if (!this.get(this.KEYS.EXPENSES)) this.set(this.KEYS.EXPENSES, []);
    if (!this.get(this.KEYS.SALARIES)) this.set(this.KEYS.SALARIES, {});
    if (!this.get(this.KEYS.BUDGETS)) this.set(this.KEYS.BUDGETS, []);
    if (!this.get(this.KEYS.TABUNG)) this.set(this.KEYS.TABUNG, []);
    if (!this.get(this.KEYS.INVESTMENTS)) this.set(this.KEYS.INVESTMENTS, []);
    if (!this.get(this.KEYS.COLLABORATORS)) this.set(this.KEYS.COLLABORATORS, []);
  },

  // Generic get/set
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // ============================================
  // Settings
  // ============================================
  getSettings() {
    return this.get(this.KEYS.SETTINGS) || { mode: 'personal', currency: 'MYR' };
  },

  setMode(mode) {
    const settings = this.getSettings();
    settings.mode = mode;
    this.set(this.KEYS.SETTINGS, settings);
  },

  getMode() {
    return this.getSettings().mode;
  },

  // ============================================
  // User
  // ============================================
  getUser() {
    return this.get(this.KEYS.USER);
  },

  setUser(user) {
    this.set(this.KEYS.USER, user);
  },

  clearUser() {
    localStorage.removeItem(this.KEYS.USER);
  },

  // ============================================
  // Expenses
  // ============================================
  getExpenses(month = null) {
    const expenses = this.get(this.KEYS.EXPENSES) || [];
    const mode = this.getMode();
    
    let filtered = expenses.filter(e => e.mode === mode);
    
    if (month) {
      filtered = filtered.filter(e => e.date.startsWith(month));
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAllExpenses() {
    return this.get(this.KEYS.EXPENSES) || [];
  },

  addExpense(expense) {
    const expenses = this.get(this.KEYS.EXPENSES) || [];
    expense.id = this.generateId();
    expense.mode = this.getMode();
    expense.createdAt = new Date().toISOString();
    expenses.push(expense);
    this.set(this.KEYS.EXPENSES, expenses);
    return expense;
  },

  updateExpense(id, data) {
    const expenses = this.get(this.KEYS.EXPENSES) || [];
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...data };
      this.set(this.KEYS.EXPENSES, expenses);
      return expenses[index];
    }
    return null;
  },

  deleteExpense(id) {
    let expenses = this.get(this.KEYS.EXPENSES) || [];
    expenses = expenses.filter(e => e.id !== id);
    this.set(this.KEYS.EXPENSES, expenses);
  },

  // ============================================
  // Salaries
  // ============================================
  getSalary(month) {
    const salaries = this.get(this.KEYS.SALARIES) || {};
    const mode = this.getMode();
    const key = `${mode}_${month}`;
    return salaries[key] || 0;
  },

  setSalary(month, amount) {
    const salaries = this.get(this.KEYS.SALARIES) || {};
    const mode = this.getMode();
    const key = `${mode}_${month}`;
    salaries[key] = amount;
    this.set(this.KEYS.SALARIES, salaries);
  },

  // ============================================
  // Budgets
  // ============================================
  getBudgets() {
    const budgets = this.get(this.KEYS.BUDGETS) || [];
    const mode = this.getMode();
    return budgets.filter(b => b.mode === mode);
  },

  addBudget(budget) {
    const budgets = this.get(this.KEYS.BUDGETS) || [];
    budget.id = this.generateId();
    budget.mode = this.getMode();
    
    // Remove existing budget for same category
    const filtered = budgets.filter(b => !(b.category === budget.category && b.mode === budget.mode));
    filtered.push(budget);
    
    this.set(this.KEYS.BUDGETS, filtered);
    return budget;
  },

  deleteBudget(id) {
    let budgets = this.get(this.KEYS.BUDGETS) || [];
    budgets = budgets.filter(b => b.id !== id);
    this.set(this.KEYS.BUDGETS, budgets);
  },

  // ============================================
  // Tabung (Savings Goals)
  // ============================================
  getTabung() {
    const tabung = this.get(this.KEYS.TABUNG) || [];
    const mode = this.getMode();
    return tabung.filter(t => t.mode === mode);
  },

  getAllTabung() {
    return this.get(this.KEYS.TABUNG) || [];
  },

  addTabung(goal) {
    const tabung = this.get(this.KEYS.TABUNG) || [];
    goal.id = this.generateId();
    goal.mode = this.getMode();
    goal.current = goal.current || 0;
    goal.transactions = [];
    goal.createdAt = new Date().toISOString();
    tabung.push(goal);
    this.set(this.KEYS.TABUNG, tabung);
    return goal;
  },

  updateTabung(id, data) {
    const tabung = this.get(this.KEYS.TABUNG) || [];
    const index = tabung.findIndex(t => t.id === id);
    if (index !== -1) {
      tabung[index] = { ...tabung[index], ...data };
      this.set(this.KEYS.TABUNG, tabung);
      return tabung[index];
    }
    return null;
  },

  addToTabung(id, amount, type = 'add') {
    const tabung = this.get(this.KEYS.TABUNG) || [];
    const index = tabung.findIndex(t => t.id === id);
    if (index !== -1) {
      const actualAmount = type === 'add' ? amount : -amount;
      tabung[index].current = Math.max(0, (tabung[index].current || 0) + actualAmount);
      tabung[index].transactions = tabung[index].transactions || [];
      tabung[index].transactions.push({
        amount: actualAmount,
        date: new Date().toISOString(),
        type
      });
      this.set(this.KEYS.TABUNG, tabung);
      return tabung[index];
    }
    return null;
  },

  deleteTabung(id) {
    let tabung = this.get(this.KEYS.TABUNG) || [];
    tabung = tabung.filter(t => t.id !== id);
    this.set(this.KEYS.TABUNG, tabung);
  },

  // ============================================
  // Investments
  // ============================================
  getInvestments() {
    const investments = this.get(this.KEYS.INVESTMENTS) || [];
    const mode = this.getMode();
    return investments.filter(i => i.mode === mode);
  },

  getAllInvestments() {
    return this.get(this.KEYS.INVESTMENTS) || [];
  },

  addInvestment(investment) {
    const investments = this.get(this.KEYS.INVESTMENTS) || [];
    investment.id = this.generateId();
    investment.mode = this.getMode();
    investment.createdAt = new Date().toISOString();
    investments.push(investment);
    this.set(this.KEYS.INVESTMENTS, investments);
    return investment;
  },

  updateInvestment(id, data) {
    const investments = this.get(this.KEYS.INVESTMENTS) || [];
    const index = investments.findIndex(i => i.id === id);
    if (index !== -1) {
      investments[index] = { ...investments[index], ...data };
      this.set(this.KEYS.INVESTMENTS, investments);
      return investments[index];
    }
    return null;
  },

  deleteInvestment(id) {
    let investments = this.get(this.KEYS.INVESTMENTS) || [];
    investments = investments.filter(i => i.id !== id);
    this.set(this.KEYS.INVESTMENTS, investments);
  },

  // ============================================
  // Collaborators
  // ============================================
  getCollaborators() {
    return this.get(this.KEYS.COLLABORATORS) || [];
  },

  addCollaborator(collaborator) {
    const collaborators = this.get(this.KEYS.COLLABORATORS) || [];
    collaborator.id = this.generateId();
    collaborator.addedAt = new Date().toISOString();
    collaborators.push(collaborator);
    this.set(this.KEYS.COLLABORATORS, collaborators);
    return collaborator;
  },

  removeCollaborator(id) {
    let collaborators = this.get(this.KEYS.COLLABORATORS) || [];
    collaborators = collaborators.filter(c => c.id !== id);
    this.set(this.KEYS.COLLABORATORS, collaborators);
  },

  // ============================================
  // Export/Import
  // ============================================
  exportAllData() {
    return {
      settings: this.get(this.KEYS.SETTINGS),
      expenses: this.get(this.KEYS.EXPENSES),
      salaries: this.get(this.KEYS.SALARIES),
      budgets: this.get(this.KEYS.BUDGETS),
      tabung: this.get(this.KEYS.TABUNG),
      investments: this.get(this.KEYS.INVESTMENTS),
      collaborators: this.get(this.KEYS.COLLABORATORS),
      exportedAt: new Date().toISOString()
    };
  },

  importAllData(data) {
    if (data.settings) this.set(this.KEYS.SETTINGS, data.settings);
    if (data.expenses) this.set(this.KEYS.EXPENSES, data.expenses);
    if (data.salaries) this.set(this.KEYS.SALARIES, data.salaries);
    if (data.budgets) this.set(this.KEYS.BUDGETS, data.budgets);
    if (data.tabung) this.set(this.KEYS.TABUNG, data.tabung);
    if (data.investments) this.set(this.KEYS.INVESTMENTS, data.investments);
    if (data.collaborators) this.set(this.KEYS.COLLABORATORS, data.collaborators);
  },

  clearAllData() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.init();
  }
};

// Initialize storage
Storage.init();
