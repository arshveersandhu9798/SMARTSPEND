/**
 * ============================================================================
 * SmartSpend – Personal Finance Tracker
 * Comprehensive, Modern, Reactive Frontend Application Architecture
 * ============================================================================
 */

(function () {
    'use strict';

    // --- Configuration & Constants ---
    const STORAGE_KEYS = {
        TRANSACTIONS: 'smartspend_transactions',
        BUDGETS: 'smartspend_budgets',
        SETTINGS: 'smartspend_settings'
    };

    const CURRENCIES = {
        INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
        USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
        EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
        GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
        JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
        CAD: { code: 'CAD', symbol: '$', name: 'Canadian Dollar', locale: 'en-CA' },
        AUD: { code: 'AUD', symbol: '$', name: 'Australian Dollar', locale: 'en-AU' },
        AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' }
    };

    const CATEGORIES = {
        Food: { name: 'Food', icon: 'fa-utensils', color: '#F97316', bg: '#FFEDD5', isExpense: true },
        Shopping: { name: 'Shopping', icon: 'fa-bag-shopping', color: '#EC4899', bg: '#FCE7F3', isExpense: true },
        Education: { name: 'Education', icon: 'fa-graduation-cap', color: '#8B5CF6', bg: '#EDE9FE', isExpense: true },
        Transport: { name: 'Transport', icon: 'fa-car', color: '#3B82F6', bg: '#DBEAFE', isExpense: true },
        Entertainment: { name: 'Entertainment', icon: 'fa-film', color: '#EAB308', bg: '#FEF9C3', isExpense: true },
        Health: { name: 'Health', icon: 'fa-heart-pulse', color: '#EF4444', bg: '#FEE2E2', isExpense: true },
        Bills: { name: 'Bills', icon: 'fa-receipt', color: '#06B6D4', bg: '#CFFAFE', isExpense: true },
        Salary: { name: 'Salary', icon: 'fa-money-bill-wave', color: '#10B981', bg: '#D1FAE5', isExpense: false },
        Other: { name: 'Other', icon: 'fa-shapes', color: '#64748B', bg: '#F1F5F9', isExpense: true }
    };

    // --- Application State ---
    const state = {
        transactions: [],
        budgets: {
            monthlyTotal: 50000,
            categories: {
                Food: 12000,
                Shopping: 8000,
                Education: 5000,
                Transport: 4500,
                Entertainment: 3500,
                Health: 4000,
                Bills: 6000,
                Other: 3000
            }
        },
        settings: {
            currency: 'INR',
            theme: 'light',
            userName: 'Arshveer',
            monthlySavingsGoal: 25000
        },
        activeTab: 'dashboard',
        analyticsPeriod: 'all',
        reportPeriod: 'current_month',
        filters: {
            search: '',
            type: 'all',
            category: 'all',
            dateRange: 'all',
            startDate: '',
            endDate: '',
            sortBy: 'date_desc'
        },
        pagination: {
            currentPage: 1,
            pageSize: 25
        },
        charts: {} // Holds active Chart.js instances
    };

    // --- Helper Utilities ---

    /**
     * Formats amount according to active currency and locale.
     */
    function formatCurrency(amount, withSymbol = true) {
        const num = parseFloat(amount) || 0;
        const curr = CURRENCIES[state.settings.currency] || CURRENCIES.INR;
        try {
            const formatted = new Intl.NumberFormat(curr.locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
            return withSymbol ? `${curr.symbol} ${formatted}` : formatted;
        } catch (e) {
            return `${curr.symbol} ${num.toFixed(2)}`;
        }
    }

    /**
     * Formats ISO date string to human-readable date.
     */
    function formatDate(dateString) {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-');
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Formats current date for the dashboard header.
     */
    function getTodayFormatted() {
        const now = new Date();
        return now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Returns today's date formatted as YYYY-MM-DD.
     */
    function getTodayISODate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Generates a unique UUID-like identifier.
     */
    function generateId() {
        return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    }

    /**
     * Safe HTML escaper to prevent XSS.
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- LocalStorage Storage Layer ---

    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
            localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.budgets));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
        } catch (err) {
            console.error('Failed to save state to LocalStorage:', err);
            showToast('Failed to save data. LocalStorage quota may be exceeded.', 'error');
        }
    }

    function loadFromStorage() {
        try {
            const storedTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
            const storedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
            const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

            if (storedTxs) {
                state.transactions = JSON.parse(storedTxs);
            } else {
                // Preload rich sample transactions on first run
                seedInitialData();
            }

            if (storedBudgets) {
                state.budgets = JSON.parse(storedBudgets);
            }

            if (storedSettings) {
                state.settings = { ...state.settings, ...JSON.parse(storedSettings) };
            }
        } catch (err) {
            console.error('Error reading from LocalStorage, restoring demo data:', err);
            seedInitialData();
        }
    }

    /**
     * Populates realistic sample data spanning current month and previous month.
     */
    function seedInitialData() {
        const now = new Date();
        const currYear = now.getFullYear();
        const currMonth = now.getMonth() + 1;
        const prevMonth = currMonth === 1 ? 12 : currMonth - 1;
        const prevYear = currMonth === 1 ? currYear - 1 : currYear;

        const pad = (n) => String(n).padStart(2, '0');

        state.transactions = [
            // Current Month Transactions
            {
                id: generateId(),
                title: 'Monthly Tech Salary',
                amount: 85000,
                type: 'income',
                category: 'Salary',
                date: `${currYear}-${pad(currMonth)}-01`,
                description: 'Direct deposit monthly payroll from employer'
            },
            {
                id: generateId(),
                title: 'Freelance UI/UX Consultation',
                amount: 24000,
                type: 'income',
                category: 'Salary',
                date: `${currYear}-${pad(currMonth)}-05`,
                description: 'Mobile App wireframe and prototype deliverable'
            },
            {
                id: generateId(),
                title: 'Supermarket Groceries & Pantry',
                amount: 4850,
                type: 'expense',
                category: 'Food',
                date: `${currYear}-${pad(currMonth)}-03`,
                description: 'Weekly organic groceries, fruits, and dairy'
            },
            {
                id: generateId(),
                title: 'Electricity & Utility Bill',
                amount: 2350,
                type: 'expense',
                category: 'Bills',
                date: `${currYear}-${pad(currMonth)}-04`,
                description: 'Monthly electricity bill payment'
            },
            {
                id: generateId(),
                title: 'Fuel & Metro SmartCard',
                amount: 1800,
                type: 'expense',
                category: 'Transport',
                date: `${currYear}-${pad(currMonth)}-06`,
                description: 'Commute expenses and vehicle petrol'
            },
            {
                id: generateId(),
                title: 'Weekend Dining & Sushi',
                amount: 2950,
                type: 'expense',
                category: 'Food',
                date: `${currYear}-${pad(currMonth)}-08`,
                description: 'Dinner with family at Japanese restaurant'
            },
            {
                id: generateId(),
                title: 'High-Speed Fiber Internet',
                amount: 1299,
                type: 'expense',
                category: 'Bills',
                date: `${currYear}-${pad(currMonth)}-10`,
                description: 'Monthly gigabit broadband subscription'
            },
            {
                id: generateId(),
                title: 'Online Cloud Computing Course',
                amount: 3499,
                type: 'expense',
                category: 'Education',
                date: `${currYear}-${pad(currMonth)}-11`,
                description: 'AWS Certification prep course bundle'
            },
            {
                id: generateId(),
                title: 'Gym & Fitness Membership',
                amount: 2500,
                type: 'expense',
                category: 'Health',
                date: `${currYear}-${pad(currMonth)}-12`,
                description: 'Quarterly membership installment'
            },
            {
                id: generateId(),
                title: 'Cinema Tickets & Snacks',
                amount: 1450,
                type: 'expense',
                category: 'Entertainment',
                date: `${currYear}-${pad(currMonth)}-14`,
                description: 'IMAX movie night with friends'
            },
            {
                id: generateId(),
                title: 'Winter Jacket & Apparel',
                amount: 5200,
                type: 'expense',
                category: 'Shopping',
                date: `${currYear}-${pad(currMonth)}-16`,
                description: 'Seasonal sale shopping'
            },
            {
                id: generateId(),
                title: 'Pharmacy & Wellness Vitamins',
                amount: 1150,
                type: 'expense',
                category: 'Health',
                date: `${currYear}-${pad(currMonth)}-17`,
                description: 'Prescription refills and supplements'
            },

            // Previous Month Transactions (for comparisons & trends)
            {
                id: generateId(),
                title: 'Previous Month Salary',
                amount: 85000,
                type: 'income',
                category: 'Salary',
                date: `${prevYear}-${pad(prevMonth)}-01`,
                description: 'Monthly payroll'
            },
            {
                id: generateId(),
                title: 'Freelance Web Design',
                amount: 18000,
                type: 'income',
                category: 'Salary',
                date: `${prevYear}-${pad(prevMonth)}-07`,
                description: 'Client landing page design'
            },
            {
                id: generateId(),
                title: 'Monthly Groceries',
                amount: 7200,
                type: 'expense',
                category: 'Food',
                date: `${prevYear}-${pad(prevMonth)}-04`,
                description: 'Bulk store groceries'
            },
            {
                id: generateId(),
                title: 'Electricity & Water Bill',
                amount: 2800,
                type: 'expense',
                category: 'Bills',
                date: `${prevYear}-${pad(prevMonth)}-06`,
                description: 'Home utilities'
            },
            {
                id: generateId(),
                title: 'Gadget Accessories & Mouse',
                amount: 3200,
                type: 'expense',
                category: 'Shopping',
                date: `${prevYear}-${pad(prevMonth)}-12`,
                description: 'Ergonomic mouse and desk mat'
            },
            {
                id: generateId(),
                title: 'Transport & Cab Rides',
                amount: 2100,
                type: 'expense',
                category: 'Transport',
                date: `${prevYear}-${pad(prevMonth)}-15`,
                description: 'City travels'
            },
            {
                id: generateId(),
                title: 'Streaming Services',
                amount: 999,
                type: 'expense',
                category: 'Entertainment',
                date: `${prevYear}-${pad(prevMonth)}-20`,
                description: 'Netflix, Spotify & Prime'
            }
        ];

        state.budgets = {
            monthlyTotal: 50000,
            categories: {
                Food: 12000,
                Shopping: 8000,
                Education: 5000,
                Transport: 4500,
                Entertainment: 3500,
                Health: 4000,
                Bills: 6000,
                Other: 3000
            }
        };

        saveToStorage();
    }

    // --- Toast Notification Engine ---
    function showToast(message, type = 'info', title = null) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-exclamation',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const defaultTitles = {
            success: 'Success',
            error: 'Error',
            warning: 'Attention',
            info: 'Notice'
        };

        const resolvedTitle = title || defaultTitles[type] || 'SmartSpend';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid ${icons[type] || 'fa-bell'}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(resolvedTitle)}</div>
                <div class="toast-msg">${escapeHtml(message)}</div>
            </div>
            <button class="toast-close-btn" aria-label="Close notification">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        const closeBtn = toast.querySelector('.toast-close-btn');
        const dismiss = () => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 250);
        };

        closeBtn.addEventListener('click', dismiss);
        container.appendChild(toast);

        // Auto dismiss after 4 seconds
        setTimeout(dismiss, 4000);
    }

    // --- Confirmation Modal Engine ---
    let confirmResolve = null;

    function showConfirmModal({ title, message, confirmText = 'Yes, Proceed', isDanger = true }) {
        return new Promise((resolve) => {
            confirmResolve = resolve;
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmModalTitle');
            const msgEl = document.getElementById('confirmModalMessage');
            const actionBtn = document.getElementById('confirmActionBtn');
            const iconBox = document.getElementById('confirmModalIcon');

            if (titleEl) titleEl.textContent = title;
            if (msgEl) msgEl.textContent = message;
            if (actionBtn) {
                actionBtn.textContent = confirmText;
                actionBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
            }
            if (iconBox) {
                iconBox.innerHTML = isDanger ?
                    '<i class="fa-solid fa-triangle-exclamation"></i>' :
                    '<i class="fa-solid fa-circle-question"></i>';
                iconBox.style.color = isDanger ? 'var(--color-expense)' : 'var(--color-primary)';
                iconBox.style.backgroundColor = isDanger ? 'var(--color-expense-light)' : 'var(--color-primary-light)';
            }

            modal.classList.remove('hidden');
        });
    }

    function initConfirmModalEvents() {
        const modal = document.getElementById('confirmModal');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const actionBtn = document.getElementById('confirmActionBtn');

        const close = (result) => {
            modal.classList.add('hidden');
            if (confirmResolve) {
                confirmResolve(result);
                confirmResolve = null;
            }
        };

        cancelBtn?.addEventListener('click', () => close(false));
        actionBtn?.addEventListener('click', () => close(true));

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) close(false);
        });
    }

    // --- Navigation & Routing ---
    function setRoute(tabId) {
        const validTabs = ['dashboard', 'transactions', 'budget', 'analytics', 'reports', 'settings'];
        if (!validTabs.includes(tabId)) {
            tabId = 'dashboard';
        }

        state.activeTab = tabId;

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.tab === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update page sections
        document.querySelectorAll('.page-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const targetSection = document.getElementById(`section-${tabId}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update topbar title
        const pageTitle = document.getElementById('pageTitle');
        const titles = {
            dashboard: 'Dashboard',
            transactions: 'Transactions',
            budget: 'Budget Planner',
            analytics: 'Financial Analytics',
            reports: 'Financial Reports',
            settings: 'Settings'
        };
        if (pageTitle) {
            pageTitle.textContent = titles[tabId] || 'Dashboard';
        }

        // Close mobile sidebar if open
        closeMobileSidebar();

        // Render target section view
        renderActiveView(tabId);
    }

    function renderActiveView(tabId) {
        switch (tabId) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'transactions':
                renderTransactionsView();
                break;
            case 'budget':
                renderBudgetView();
                break;
            case 'analytics':
                renderAnalyticsView();
                break;
            case 'reports':
                renderReportsView();
                break;
            case 'settings':
                renderSettingsView();
                break;
        }
        updateGlobalBadges();
    }

    function initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.dataset.tab;
                if (tab) {
                    window.location.hash = tab;
                    setRoute(tab);
                }
            });
        });

        // Mobile drawer buttons
        const menuBtn = document.getElementById('menuToggleBtn');
        const closeBtn = document.getElementById('sidebarCloseBtn');
        const overlay = document.getElementById('sidebarOverlay');

        menuBtn?.addEventListener('click', openMobileSidebar);
        closeBtn?.addEventListener('click', closeMobileSidebar);
        overlay?.addEventListener('click', closeMobileSidebar);

        // View All Transactions jump
        document.getElementById('viewAllTxBtn')?.addEventListener('click', () => {
            window.location.hash = 'transactions';
            setRoute('transactions');
        });

        // Jump to budget jump
        document.getElementById('jumpToBudgetBtn')?.addEventListener('click', () => {
            window.location.hash = 'budget';
            setRoute('budget');
        });

        // Quick currency pill in topbar jumps to settings
        document.getElementById('currencyQuickBtn')?.addEventListener('click', () => {
            window.location.hash = 'settings';
            setRoute('settings');
            const currencySelect = document.getElementById('currencySelect');
            currencySelect?.focus();
        });

        // Quick add buttons on welcome banner
        document.getElementById('quickAddExpenseBtn')?.addEventListener('click', () => {
            openTransactionModal('expense');
        });
        document.getElementById('quickAddIncomeBtn')?.addEventListener('click', () => {
            openTransactionModal('income');
        });

        // Topbar quick add
        document.getElementById('openAddTxModalBtn')?.addEventListener('click', () => {
            openTransactionModal('expense');
        });

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            setRoute(hash);
        });

        // Initial route
        const initialHash = window.location.hash.replace('#', '') || 'dashboard';
        setRoute(initialHash);
    }

    function openMobileSidebar() {
        document.getElementById('sidebar')?.classList.add('mobile-open');
        document.getElementById('sidebarOverlay')?.classList.add('active');
    }

    function closeMobileSidebar() {
        document.getElementById('sidebar')?.classList.remove('mobile-open');
        document.getElementById('sidebarOverlay')?.classList.remove('active');
    }

    // --- Theme & Appearance Engine ---
    function initTheme() {
        const savedTheme = state.settings.theme || 'light';
        applyTheme(savedTheme);

        const themeToggleBtn = document.getElementById('themeToggleBtn');
        themeToggleBtn?.addEventListener('click', () => {
            const newTheme = state.settings.theme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
            state.settings.theme = newTheme;
            saveToStorage();
            showToast(`Switched to ${newTheme} mode.`, 'info');
        });

        // Radio buttons on settings page
        document.querySelectorAll('input[name="appTheme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                applyTheme(newTheme);
                state.settings.theme = newTheme;
                saveToStorage();
            });
        });
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }

        // Sync radio buttons on settings page if present
        const radio = document.querySelector(`input[name="appTheme"][value="${theme}"]`);
        if (radio) radio.checked = true;

        // Re-render charts so their grid & text colors adapt to theme
        if (typeof Chart !== 'undefined') {
            rebuildAllCharts();
        }
    }

    // --- Currency Engine ---
    function updateCurrencySymbols() {
        const curr = CURRENCIES[state.settings.currency] || CURRENCIES.INR;

        // Topbar badge
        const symbolEl = document.getElementById('topbarCurrencySymbol');
        const codeEl = document.getElementById('topbarCurrencyCode');
        if (symbolEl) symbolEl.textContent = curr.symbol;
        if (codeEl) codeEl.textContent = curr.code;

        // Modal addon symbols
        const modalCurrSymbol = document.getElementById('modalCurrencySymbol');
        if (modalCurrSymbol) modalCurrSymbol.textContent = curr.symbol;

        const budgetModalCurr = document.getElementById('budgetModalCurrencySymbol');
        if (budgetModalCurr) budgetModalCurr.textContent = curr.symbol;

        const savingsGoalCurr = document.getElementById('savingsGoalCurrencySymbol');
        if (savingsGoalCurr) savingsGoalCurr.textContent = curr.symbol;

        // Settings preview
        const preview = document.getElementById('currencyPreview');
        if (preview) preview.textContent = formatCurrency(125000);
    }

    // --- Calculations & Financial Metrics ---
    function getFinancialMetrics(filteredTransactions = state.transactions) {
        let totalIncome = 0;
        let totalExpenses = 0;
        let incomeCount = 0;
        let expenseCount = 0;

        filteredTransactions.forEach(tx => {
            const amount = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') {
                totalIncome += amount;
                incomeCount++;
            } else if (tx.type === 'expense') {
                totalExpenses += amount;
                expenseCount++;
            }
        });

        const totalBalance = totalIncome - totalExpenses;
        const totalSavings = totalBalance > 0 ? totalBalance : 0;
        const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

        return {
            totalIncome,
            totalExpenses,
            totalBalance,
            totalSavings,
            savingsRate: Math.max(0, savingsRate),
            incomeCount,
            expenseCount
        };
    }

    function getCurrentMonthTransactions() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `${year}-${month}`;
        return state.transactions.filter(tx => tx.date && tx.date.startsWith(prefix));
    }

    function getSpendingByCategory(transactionsList = getCurrentMonthTransactions()) {
        const categorySpend = {};
        Object.keys(CATEGORIES).forEach(cat => {
            if (CATEGORIES[cat].isExpense) {
                categorySpend[cat] = 0;
            }
        });

        transactionsList.forEach(tx => {
            if (tx.type === 'expense' && tx.category) {
                const cat = tx.category;
                categorySpend[cat] = (categorySpend[cat] || 0) + (parseFloat(tx.amount) || 0);
            }
        });

        return categorySpend;
    }

    // --- Global Badges & Sidebar Sync ---
    function updateGlobalBadges() {
        // Total transactions count badge on sidebar
        const countBadge = document.getElementById('navTxCount');
        if (countBadge) countBadge.textContent = state.transactions.length;

        // Current date display in topbar
        const dateText = document.getElementById('dateText');
        if (dateText) dateText.textContent = getTodayFormatted();

        // User info in sidebar & welcome
        const userName = state.settings.userName || 'User';
        const sidebarUserName = document.getElementById('sidebarUserName');
        const welcomeUserName = document.getElementById('welcomeUserName');
        const sidebarAvatar = document.getElementById('sidebarUserAvatar');

        if (sidebarUserName) sidebarUserName.textContent = userName;
        if (welcomeUserName) welcomeUserName.textContent = userName;
        if (sidebarAvatar) {
            const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SS';
            sidebarAvatar.textContent = initials;
        }

        // Sidebar mini budget widget
        const currentMonthTxs = getCurrentMonthTransactions();
        let currentMonthSpent = 0;
        currentMonthTxs.forEach(tx => {
            if (tx.type === 'expense') currentMonthSpent += (parseFloat(tx.amount) || 0);
        });

        const totalBudget = state.budgets.monthlyTotal || 50000;
        const pctUsed = totalBudget > 0 ? Math.min(100, Math.round((currentMonthSpent / totalBudget) * 100)) : 0;

        const sidebarBudgetPct = document.getElementById('sidebarBudgetPct');
        const sidebarProgressBar = document.getElementById('sidebarProgressBar');
        const sidebarBudgetSpent = document.getElementById('sidebarBudgetSpent');
        const sidebarBudgetTotal = document.getElementById('sidebarBudgetTotal');

        if (sidebarBudgetPct) sidebarBudgetPct.textContent = `${pctUsed}%`;
        if (sidebarProgressBar) {
            sidebarProgressBar.style.width = `${pctUsed}%`;
            if (pctUsed > 100) {
                sidebarProgressBar.style.backgroundColor = 'var(--color-expense)';
            } else if (pctUsed > 80) {
                sidebarProgressBar.style.backgroundColor = 'var(--color-warning)';
            } else {
                sidebarProgressBar.style.backgroundColor = 'var(--color-primary)';
            }
        }
        if (sidebarBudgetSpent) sidebarBudgetSpent.textContent = formatCurrency(currentMonthSpent);
        if (sidebarBudgetTotal) sidebarBudgetTotal.textContent = formatCurrency(totalBudget);
    }

    // ==========================================================================
    // 1. DASHBOARD VIEW CONTROLLER
    // ==========================================================================
    function renderDashboard() {
        const metrics = getFinancialMetrics();

        // Update Summary Cards
        const dashBalance = document.getElementById('dashTotalBalance');
        const dashIncome = document.getElementById('dashTotalIncome');
        const dashExpenses = document.getElementById('dashTotalExpenses');
        const dashSavings = document.getElementById('dashTotalSavings');
        const dashSavingsRate = document.getElementById('dashSavingsRate');
        const dashIncomeCount = document.getElementById('dashIncomeCount');
        const dashExpenseCount = document.getElementById('dashExpenseCount');

        if (dashBalance) dashBalance.textContent = formatCurrency(metrics.totalBalance);
        if (dashIncome) dashIncome.textContent = formatCurrency(metrics.totalIncome);
        if (dashExpenses) dashExpenses.textContent = formatCurrency(metrics.totalExpenses);
        if (dashSavings) dashSavings.textContent = formatCurrency(metrics.totalSavings);
        if (dashSavingsRate) dashSavingsRate.textContent = `${metrics.savingsRate}%`;
        if (dashIncomeCount) dashIncomeCount.textContent = metrics.incomeCount;
        if (dashExpenseCount) dashExpenseCount.textContent = metrics.expenseCount;

        // Render Recent Transactions (Last 5)
        renderRecentTransactions();

        // Render Quick Budget Health list
        renderQuickBudgetSnapshot();

        // Generate Financial Insight Text
        generateDashboardInsight(metrics);

        // Render Dashboard Charts
        renderDashboardCharts();
    }

    function renderRecentTransactions() {
        const tableBody = document.getElementById('recentTxTableBody');
        const emptyState = document.getElementById('recentTxEmpty');
        const tableWrap = document.getElementById('recentTxTable');

        if (!tableBody) return;

        // Sort by date desc, take 5
        const sorted = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        if (sorted.length === 0) {
            tableBody.innerHTML = '';
            tableWrap?.classList.add('hidden');
            emptyState?.classList.remove('hidden');
            return;
        }

        tableWrap?.classList.remove('hidden');
        emptyState?.classList.add('hidden');

        let html = '';
        sorted.forEach(tx => {
            const cat = CATEGORIES[tx.category] || CATEGORIES.Other;
            const isIncome = tx.type === 'income';
            const amountFormatted = (isIncome ? '+ ' : '- ') + formatCurrency(tx.amount);
            const amountClass = isIncome ? 'amount-income' : 'amount-expense';
            const typePillClass = isIncome ? 'type-pill-income' : 'type-pill-expense';

            html += `
                <tr>
                    <td>
                        <div class="tx-title-cell">
                            <span class="tx-title-main">${escapeHtml(tx.title)}</span>
                            ${tx.description ? `<span class="tx-notes-sub">${escapeHtml(tx.description)}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="category-tag" style="background-color: ${cat.bg}; color: ${cat.color};">
                            <i class="fa-solid ${cat.icon}"></i> ${escapeHtml(cat.name)}
                        </span>
                    </td>
                    <td>${formatDate(tx.date)}</td>
                    <td>
                        <span class="type-pill ${typePillClass}">${escapeHtml(tx.type)}</span>
                    </td>
                    <td class="text-right ${amountClass}">${amountFormatted}</td>
                    <td class="text-center">
                        <div class="tx-action-btns">
                            <button class="action-icon-btn btn-edit" onclick="window.app.editTransaction('${tx.id}')" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="action-icon-btn btn-delete" onclick="window.app.deleteTransaction('${tx.id}')" title="Delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    function renderQuickBudgetSnapshot() {
        const container = document.getElementById('quickBudgetList');
        if (!container) return;

        const currentMonthTxs = getCurrentMonthTransactions();
        const catSpend = getSpendingByCategory(currentMonthTxs);
        const budgets = state.budgets.categories || {};

        // Top 3 categories with highest allocation
        const topCategories = ['Food', 'Bills', 'Shopping'];

        let html = '';
        topCategories.forEach(catName => {
            const cat = CATEGORIES[catName] || CATEGORIES.Other;
            const limit = budgets[catName] || 5000;
            const spent = catSpend[catName] || 0;
            const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

            let fillColor = 'var(--color-primary)';
            if (pct > 90) fillColor = 'var(--color-expense)';
            else if (pct > 70) fillColor = 'var(--color-warning)';

            html += `
                <div class="quick-budget-item">
                    <div class="qb-meta-row">
                        <div class="qb-cat-name">
                            <div class="qb-cat-icon" style="background-color: ${cat.bg}; color: ${cat.color};">
                                <i class="fa-solid ${cat.icon}"></i>
                            </div>
                            <span>${cat.name}</span>
                        </div>
                        <div class="qb-values">
                            <strong>${formatCurrency(spent)}</strong> / ${formatCurrency(limit)} (${pct}%)
                        </div>
                    </div>
                    <div class="progress-bar-wrap">
                        <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${fillColor};"></div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function generateDashboardInsight(metrics) {
        const textEl = document.getElementById('dashInsightText');
        if (!textEl) return;

        if (state.transactions.length === 0) {
            textEl.textContent = 'Welcome to SmartSpend! Add your first income or expense transaction to unlock personalized insights.';
            return;
        }

        const currMonthTxs = getCurrentMonthTransactions();
        const catSpend = getSpendingByCategory(currMonthTxs);
        let topCat = 'None';
        let maxSpend = 0;

        Object.keys(catSpend).forEach(cat => {
            if (catSpend[cat] > maxSpend) {
                maxSpend = catSpend[cat];
                topCat = cat;
            }
        });

        let insight = '';
        if (metrics.savingsRate >= 30) {
            insight = `Fantastic discipline! You are saving ${metrics.savingsRate}% of your total income. At this pace, you will comfortably hit your savings goal!`;
        } else if (metrics.savingsRate > 0) {
            insight = `You are maintaining a positive net cash flow with a ${metrics.savingsRate}% savings rate. Your highest spending area this month is ${topCat} (${formatCurrency(maxSpend)}).`;
        } else if (metrics.totalExpenses > metrics.totalIncome && metrics.totalIncome > 0) {
            insight = `Alert: Current expenses exceed income by ${formatCurrency(metrics.totalExpenses - metrics.totalIncome)}. Consider reviewing ${topCat} to balance your cash flow.`;
        } else {
            insight = `Track all daily expenses to see comprehensive budgeting insights and monthly savings projections.`;
        }

        textEl.textContent = insight;
    }

    // ==========================================================================
    // CHART.JS CONTROLLERS
    // ==========================================================================
    function getChartThemeColors() {
        const isDark = state.settings.theme === 'dark';
        return {
            textColor: isDark ? '#94A3B8' : '#64748B',
            gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
        };
    }

    function destroyChart(chartKey) {
        if (state.charts[chartKey]) {
            state.charts[chartKey].destroy();
            delete state.charts[chartKey];
        }
    }

    function rebuildAllCharts() {
        if (state.activeTab === 'dashboard') {
            renderDashboardCharts();
        } else if (state.activeTab === 'analytics') {
            renderAnalyticsCharts();
        }
    }

    function renderDashboardCharts() {
        if (typeof Chart === 'undefined') return;

        const theme = getChartThemeColors();

        // 1. Income vs Expenses Bar Chart (Monthly)
        renderIncomeExpenseChart(theme);

        // 2. Category Doughnut Chart
        renderCategoryDoughnutChart(theme);

        // 3. Monthly Spending Trend Line Chart
        renderMonthlyTrendChart(theme);
    }

    function renderIncomeExpenseChart(theme) {
        const canvas = document.getElementById('chartIncomeExpense');
        if (!canvas) return;

        destroyChart('incomeExpense');

        // Aggregate by months (last 6 months)
        const monthMap = {};
        const monthLabels = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            monthMap[key] = { label, income: 0, expense: 0 };
            monthLabels.push(key);
        }

        state.transactions.forEach(tx => {
            if (!tx.date) return;
            const key = tx.date.substring(0, 7);
            if (monthMap[key]) {
                const amt = parseFloat(tx.amount) || 0;
                if (tx.type === 'income') monthMap[key].income += amt;
                else if (tx.type === 'expense') monthMap[key].expense += amt;
            }
        });

        const labels = monthLabels.map(k => monthMap[k].label);
        const incomeData = monthLabels.map(k => monthMap[k].income);
        const expenseData = monthLabels.map(k => monthMap[k].expense);

        state.charts['incomeExpense'] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: '#10B981',
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.6
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: '#EF4444',
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: theme.textColor, font: { family: theme.fontFamily, weight: '600' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: theme.textColor, font: { family: theme.fontFamily } }
                    },
                    y: {
                        grid: { color: theme.gridColor },
                        ticks: {
                            color: theme.textColor,
                            font: { family: theme.fontFamily },
                            callback: (v) => formatCurrency(v, false)
                        }
                    }
                }
            }
        });
    }

    function renderCategoryDoughnutChart(theme) {
        const canvas = document.getElementById('chartCategoryDoughnut');
        const emptyFallback = document.getElementById('categoryDoughnutEmpty');
        if (!canvas) return;

        destroyChart('categoryDoughnut');

        const catSpend = getSpendingByCategory(state.transactions);
        const labels = [];
        const data = [];
        const bgColors = [];

        Object.keys(catSpend).forEach(catName => {
            if (catSpend[catName] > 0) {
                labels.push(catName);
                data.push(catSpend[catName]);
                bgColors.push(CATEGORIES[catName]?.color || '#94A3B8');
            }
        });

        if (data.length === 0) {
            canvas.style.display = 'none';
            if (emptyFallback) emptyFallback.style.display = 'flex';
            return;
        } else {
            canvas.style.display = 'block';
            if (emptyFallback) emptyFallback.style.display = 'none';
        }

        state.charts['categoryDoughnut'] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: bgColors,
                        borderWidth: 2,
                        borderColor: state.settings.theme === 'dark' ? '#1E293B' : '#FFFFFF',
                        hoverOffset: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: theme.textColor,
                            font: { family: theme.fontFamily, size: 11, weight: '600' },
                            padding: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.label}: ${formatCurrency(context.parsed)}`
                        }
                    }
                },
                cutout: '68%'
            }
        });
    }

    function renderMonthlyTrendChart(theme) {
        const canvas = document.getElementById('chartMonthlyTrend');
        if (!canvas) return;

        destroyChart('monthlyTrend');

        // Show spending trend over the past 30 days
        const daysMap = {};
        const labels = [];
        const now = new Date();

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            daysMap[iso] = { label, amount: 0 };
            labels.push(iso);
        }

        state.transactions.forEach(tx => {
            if (tx.type === 'expense' && daysMap[tx.date]) {
                daysMap[tx.date].amount += (parseFloat(tx.amount) || 0);
            }
        });

        const displayLabels = labels.map((k, idx) => (idx % 3 === 0 ? daysMap[k].label : ''));
        const spendPoints = labels.map(k => daysMap[k].amount);

        state.charts['monthlyTrend'] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: displayLabels,
                datasets: [
                    {
                        label: 'Daily Expenses',
                        data: spendPoints,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#10B981'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const idx = items[0].dataIndex;
                                return daysMap[labels[idx]]?.label || '';
                            },
                            label: (context) => ` Spent: ${formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: theme.textColor, font: { family: theme.fontFamily } }
                    },
                    y: {
                        grid: { color: theme.gridColor },
                        ticks: {
                            color: theme.textColor,
                            font: { family: theme.fontFamily },
                            callback: (v) => formatCurrency(v, false)
                        }
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 2. TRANSACTIONS SECTION CONTROLLER
    // ==========================================================================
    function renderTransactionsView() {
        const filtered = getFilteredTransactions();
        const totalCount = filtered.length;

        // Update count indicator
        const countEl = document.getElementById('txResultsCount');
        if (countEl) {
            countEl.textContent = `Showing ${totalCount} transaction${totalCount === 1 ? '' : 's'}`;
        }

        // Apply pagination
        const pageSize = state.pagination.pageSize;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        if (state.pagination.currentPage > totalPages) {
            state.pagination.currentPage = totalPages;
        }
        const currentPage = state.pagination.currentPage;
        const startIdx = (currentPage - 1) * pageSize;
        const pageItems = filtered.slice(startIdx, startIdx + pageSize);

        // Render table rows
        const tableBody = document.getElementById('allTxTableBody');
        const emptyState = document.getElementById('allTxEmpty');
        const table = document.getElementById('allTransactionsTable');
        const paginationWrap = document.getElementById('txPaginationWrap');

        if (!tableBody) return;

        if (totalCount === 0) {
            tableBody.innerHTML = '';
            table?.classList.add('hidden');
            emptyState?.classList.remove('hidden');
            if (paginationWrap) paginationWrap.classList.add('hidden');
            return;
        }

        table?.classList.remove('hidden');
        emptyState?.classList.add('hidden');
        if (paginationWrap) paginationWrap.classList.remove('hidden');

        let html = '';
        pageItems.forEach(tx => {
            const cat = CATEGORIES[tx.category] || CATEGORIES.Other;
            const isIncome = tx.type === 'income';
            const amountFormatted = (isIncome ? '+ ' : '- ') + formatCurrency(tx.amount);
            const amountClass = isIncome ? 'amount-income' : 'amount-expense';
            const typePillClass = isIncome ? 'type-pill-income' : 'type-pill-expense';

            html += `
                <tr>
                    <td>
                        <div class="tx-title-cell">
                            <span class="tx-title-main">${escapeHtml(tx.title)}</span>
                            ${tx.description ? `<span class="tx-notes-sub">${escapeHtml(tx.description)}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="category-tag" style="background-color: ${cat.bg}; color: ${cat.color};">
                            <i class="fa-solid ${cat.icon}"></i> ${escapeHtml(cat.name)}
                        </span>
                    </td>
                    <td>${formatDate(tx.date)}</td>
                    <td>
                        <span class="type-pill ${typePillClass}">${escapeHtml(tx.type)}</span>
                    </td>
                    <td class="text-right ${amountClass}">${amountFormatted}</td>
                    <td class="text-center">
                        <div class="tx-action-btns">
                            <button class="action-icon-btn btn-edit" onclick="window.app.editTransaction('${tx.id}')" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="action-icon-btn btn-delete" onclick="window.app.deleteTransaction('${tx.id}')" title="Delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;

        // Update pagination controls
        const indicator = document.getElementById('pageIndicator');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (indicator) indicator.textContent = `Page ${currentPage} of ${totalPages}`;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    function getFilteredTransactions() {
        let list = [...state.transactions];
        const f = state.filters;

        // Search by title or description
        if (f.search.trim() !== '') {
            const q = f.search.toLowerCase().trim();
            list = list.filter(tx =>
                (tx.title && tx.title.toLowerCase().includes(q)) ||
                (tx.description && tx.description.toLowerCase().includes(q))
            );
        }

        // Type filter
        if (f.type !== 'all') {
            list = list.filter(tx => tx.type === f.type);
        }

        // Category filter
        if (f.category !== 'all') {
            list = list.filter(tx => tx.category === f.category);
        }

        // Date timeframe filter
        const now = new Date();
        const currYear = now.getFullYear();
        const currMonth = now.getMonth() + 1;
        const pad = (n) => String(n).padStart(2, '0');

        if (f.dateRange === 'this_month') {
            const prefix = `${currYear}-${pad(currMonth)}`;
            list = list.filter(tx => tx.date && tx.date.startsWith(prefix));
        } else if (f.dateRange === 'last_month') {
            const prevMonth = currMonth === 1 ? 12 : currMonth - 1;
            const prevYear = currMonth === 1 ? currYear - 1 : currYear;
            const prefix = `${prevYear}-${pad(prevMonth)}`;
            list = list.filter(tx => tx.date && tx.date.startsWith(prefix));
        } else if (f.dateRange === 'last_30_days') {
            const threshold = new Date();
            threshold.setDate(threshold.getDate() - 30);
            list = list.filter(tx => new Date(tx.date) >= threshold);
        } else if (f.dateRange === 'this_year') {
            list = list.filter(tx => tx.date && tx.date.startsWith(String(currYear)));
        } else if (f.dateRange === 'custom') {
            if (f.startDate) {
                list = list.filter(tx => tx.date >= f.startDate);
            }
            if (f.endDate) {
                list = list.filter(tx => tx.date <= f.endDate);
            }
        }

        // Sorting
        list.sort((a, b) => {
            switch (f.sortBy) {
                case 'date_asc':
                    return new Date(a.date) - new Date(b.date);
                case 'date_desc':
                    return new Date(b.date) - new Date(a.date);
                case 'amount_asc':
                    return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
                case 'amount_desc':
                    return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });

        return list;
    }

    function initTransactionsEvents() {
        const searchInput = document.getElementById('txSearchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const typeFilter = document.getElementById('txTypeFilter');
        const categoryFilter = document.getElementById('txCategoryFilter');
        const dateFilter = document.getElementById('txDateFilter');
        const sortBy = document.getElementById('txSortBy');
        const customDateWrap = document.getElementById('customDateRangeWrap');
        const applyCustomDateBtn = document.getElementById('applyCustomDateBtn');
        const resetFiltersBtn = document.getElementById('resetFiltersBtn');
        const pageSizeSelect = document.getElementById('txPageSize');
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');

        // Search input
        searchInput?.addEventListener('input', (e) => {
            state.filters.search = e.target.value;
            state.pagination.currentPage = 1;
            if (e.target.value) {
                clearSearchBtn?.classList.remove('hidden');
            } else {
                clearSearchBtn?.classList.add('hidden');
            }
            renderTransactionsView();
        });

        clearSearchBtn?.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            state.filters.search = '';
            clearSearchBtn.classList.add('hidden');
            state.pagination.currentPage = 1;
            renderTransactionsView();
        });

        // Type filter
        typeFilter?.addEventListener('change', (e) => {
            state.filters.type = e.target.value;
            state.pagination.currentPage = 1;
            renderTransactionsView();
        });

        // Category filter
        categoryFilter?.addEventListener('change', (e) => {
            state.filters.category = e.target.value;
            state.pagination.currentPage = 1;
            renderTransactionsView();
        });

        // Date filter
        dateFilter?.addEventListener('change', (e) => {
            state.filters.dateRange = e.target.value;
            state.pagination.currentPage = 1;
            if (e.target.value === 'custom') {
                customDateWrap?.classList.remove('hidden');
            } else {
                customDateWrap?.classList.add('hidden');
                renderTransactionsView();
            }
        });

        // Custom date apply
        applyCustomDateBtn?.addEventListener('click', () => {
            const start = document.getElementById('txStartDate')?.value;
            const end = document.getElementById('txEndDate')?.value;
            state.filters.startDate = start || '';
            state.filters.endDate = end || '';
            state.pagination.currentPage = 1;
            renderTransactionsView();
        });

        // Sort by
        sortBy?.addEventListener('change', (e) => {
            state.filters.sortBy = e.target.value;
            renderTransactionsView();
        });

        // Reset filters
        resetFiltersBtn?.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
            if (typeFilter) typeFilter.value = 'all';
            if (categoryFilter) categoryFilter.value = 'all';
            if (dateFilter) dateFilter.value = 'all';
            if (sortBy) sortBy.value = 'date_desc';
            if (customDateWrap) customDateWrap.classList.add('hidden');

            state.filters = {
                search: '',
                type: 'all',
                category: 'all',
                dateRange: 'all',
                startDate: '',
                endDate: '',
                sortBy: 'date_desc'
            };
            state.pagination.currentPage = 1;
            renderTransactionsView();
            showToast('Filters reset to default.', 'info');
        });

        // Pagination controls
        pageSizeSelect?.addEventListener('change', (e) => {
            state.pagination.pageSize = parseInt(e.target.value, 10) || 25;
            state.pagination.currentPage = 1;
            renderTransactionsView();
        });

        prevPageBtn?.addEventListener('click', () => {
            if (state.pagination.currentPage > 1) {
                state.pagination.currentPage--;
                renderTransactionsView();
            }
        });

        nextPageBtn?.addEventListener('click', () => {
            state.pagination.currentPage++;
            renderTransactionsView();
        });

        // Add transaction button in section header
        document.getElementById('addTxSectionBtn')?.addEventListener('click', () => {
            openTransactionModal('expense');
        });

        document.getElementById('emptyStateAddTxBtn')?.addEventListener('click', () => {
            openTransactionModal('expense');
        });

        // Export CSV button
        document.getElementById('exportTxCsvBtn')?.addEventListener('click', () => {
            exportTransactionsToCSV(getFilteredTransactions(), 'smartspend-transactions.csv');
        });
    }

    // ==========================================================================
    // TRANSACTION MODAL (ADD / EDIT)
    // ==========================================================================
    function openTransactionModal(type = 'expense', editTxId = null) {
        const modal = document.getElementById('transactionModal');
        const form = document.getElementById('transactionForm');
        const modalTitle = document.getElementById('txModalTitle');
        const submitBtnText = document.getElementById('saveTxBtnText');
        const editIdInput = document.getElementById('txFormEditId');

        if (!modal || !form) return;

        // Reset errors
        document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));

        // Update currency symbol
        updateCurrencySymbols();

        if (editTxId) {
            // Edit Mode
            const tx = state.transactions.find(t => t.id === editTxId);
            if (!tx) return;

            modalTitle.textContent = 'Edit Transaction';
            submitBtnText.textContent = 'Update Transaction';
            editIdInput.value = tx.id;

            setModalTransactionType(tx.type);
            document.getElementById('txTitleInput').value = tx.title;
            document.getElementById('txAmountInput').value = tx.amount;
            document.getElementById('txCategorySelect').value = tx.category;
            document.getElementById('txDateInput').value = tx.date;
            document.getElementById('txDescInput').value = tx.description || '';
        } else {
            // Add Mode
            modalTitle.textContent = 'Add New Transaction';
            submitBtnText.textContent = 'Save Transaction';
            editIdInput.value = '';
            form.reset();

            setModalTransactionType(type);
            document.getElementById('txDateInput').value = getTodayISODate();
        }

        modal.classList.remove('hidden');
    }

    function closeTransactionModal() {
        const modal = document.getElementById('transactionModal');
        modal?.classList.add('hidden');
    }

    function setModalTransactionType(type) {
        const typeInput = document.getElementById('txTypeInput');
        const expenseTab = document.getElementById('typeTabExpense');
        const incomeTab = document.getElementById('typeTabIncome');
        const catSelect = document.getElementById('txCategorySelect');

        if (typeInput) typeInput.value = type;

        if (type === 'income') {
            incomeTab?.classList.add('active');
            expenseTab?.classList.remove('active');
            if (catSelect && (!catSelect.value || catSelect.value === 'Food')) {
                catSelect.value = 'Salary';
            }
        } else {
            expenseTab?.classList.add('active');
            incomeTab?.classList.remove('active');
            if (catSelect && catSelect.value === 'Salary') {
                catSelect.value = 'Food';
            }
        }
    }

    function initTransactionModalEvents() {
        const modal = document.getElementById('transactionModal');
        const closeBtn = document.getElementById('closeTxModalBtn');
        const cancelBtn = document.getElementById('cancelTxModalBtn');
        const form = document.getElementById('transactionForm');
        const expenseTab = document.getElementById('typeTabExpense');
        const incomeTab = document.getElementById('typeTabIncome');

        closeBtn?.addEventListener('click', closeTransactionModal);
        cancelBtn?.addEventListener('click', closeTransactionModal);

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeTransactionModal();
        });

        expenseTab?.addEventListener('click', () => setModalTransactionType('expense'));
        incomeTab?.addEventListener('click', () => setModalTransactionType('income'));

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            handleTransactionFormSubmit();
        });
    }

    function handleTransactionFormSubmit() {
        const editId = document.getElementById('txFormEditId').value;
        const type = document.getElementById('txTypeInput').value;
        const titleInput = document.getElementById('txTitleInput');
        const amountInput = document.getElementById('txAmountInput');
        const categorySelect = document.getElementById('txCategorySelect');
        const dateInput = document.getElementById('txDateInput');
        const descInput = document.getElementById('txDescInput');

        let isValid = true;

        // Validate Title
        const title = titleInput.value.trim();
        const titleError = document.getElementById('txTitleError');
        if (!title) {
            titleInput.classList.add('is-invalid');
            titleError.classList.add('show');
            isValid = false;
        } else {
            titleInput.classList.remove('is-invalid');
            titleError.classList.remove('show');
        }

        // Validate Amount (> 0)
        const amount = parseFloat(amountInput.value);
        const amountError = document.getElementById('txAmountError');
        if (isNaN(amount) || amount <= 0) {
            amountInput.classList.add('is-invalid');
            amountError.classList.add('show');
            isValid = false;
        } else {
            amountInput.classList.remove('is-invalid');
            amountError.classList.remove('show');
        }

        // Validate Category
        const category = categorySelect.value;
        const categoryError = document.getElementById('txCategoryError');
        if (!category) {
            categorySelect.classList.add('is-invalid');
            categoryError.classList.add('show');
            isValid = false;
        } else {
            categorySelect.classList.remove('is-invalid');
            categoryError.classList.remove('show');
        }

        // Validate Date
        const date = dateInput.value;
        const dateError = document.getElementById('txDateError');
        if (!date) {
            dateInput.classList.add('is-invalid');
            dateError.classList.add('show');
            isValid = false;
        } else {
            dateInput.classList.remove('is-invalid');
            dateError.classList.remove('show');
        }

        if (!isValid) return;

        const description = descInput.value.trim();

        if (editId) {
            // Update existing transaction
            const idx = state.transactions.findIndex(t => t.id === editId);
            if (idx !== -1) {
                state.transactions[idx] = {
                    ...state.transactions[idx],
                    title,
                    amount,
                    type,
                    category,
                    date,
                    description
                };
                showToast(`Updated "${title}" successfully!`, 'success');
            }
        } else {
            // Add new transaction
            const newTx = {
                id: generateId(),
                title,
                amount,
                type,
                category,
                date,
                description,
                createdAt: new Date().toISOString()
            };
            state.transactions.unshift(newTx);
            showToast(`Added "${title}" (${formatCurrency(amount)}) successfully!`, 'success');
        }

        saveToStorage();
        closeTransactionModal();

        // Refresh whichever view is currently active
        renderActiveView(state.activeTab);
    }

    async function deleteTransaction(txId) {
        const tx = state.transactions.find(t => t.id === txId);
        if (!tx) return;

        const confirmed = await showConfirmModal({
            title: 'Delete Transaction?',
            message: `Are you sure you want to permanently delete "${tx.title}" (${formatCurrency(tx.amount)})?`,
            confirmText: 'Yes, Delete',
            isDanger: true
        });

        if (confirmed) {
            state.transactions = state.transactions.filter(t => t.id !== txId);
            saveToStorage();
            showToast(`Transaction "${tx.title}" deleted.`, 'info');
            renderActiveView(state.activeTab);
        }
    }

    // ==========================================================================
    // 3. BUDGET PLANNER SECTION CONTROLLER
    // ==========================================================================
    function renderBudgetView() {
        const currentMonthTxs = getCurrentMonthTransactions();
        const catSpend = getSpendingByCategory(currentMonthTxs);

        let totalMonthSpent = 0;
        currentMonthTxs.forEach(tx => {
            if (tx.type === 'expense') totalMonthSpent += (parseFloat(tx.amount) || 0);
        });

        const totalBudget = state.budgets.monthlyTotal || 50000;
        const totalRemaining = Math.max(0, totalBudget - totalMonthSpent);
        const totalPct = totalBudget > 0 ? Math.round((totalMonthSpent / totalBudget) * 100) : 0;

        // Master Card Metrics
        const budgetTotalCap = document.getElementById('budgetTotalCap');
        const budgetTotalSpent = document.getElementById('budgetTotalSpent');
        const budgetTotalRemaining = document.getElementById('budgetTotalRemaining');
        const budgetTotalPercent = document.getElementById('budgetTotalPercent');
        const budgetProgressBar = document.getElementById('budgetTotalProgressBar');
        const statusTag = document.getElementById('overallBudgetStatusTag');
        const alertBanner = document.getElementById('masterBudgetAlert');
        const alertTitle = document.getElementById('masterAlertTitle');
        const alertDesc = document.getElementById('masterAlertDesc');

        if (budgetTotalCap) budgetTotalCap.textContent = formatCurrency(totalBudget);
        if (budgetTotalSpent) budgetTotalSpent.textContent = formatCurrency(totalMonthSpent);
        if (budgetTotalRemaining) budgetTotalRemaining.textContent = formatCurrency(totalRemaining);
        if (budgetTotalPercent) budgetTotalPercent.textContent = `${totalPct}%`;

        if (budgetProgressBar) {
            budgetProgressBar.style.width = `${Math.min(100, totalPct)}%`;
            if (totalPct > 100) {
                budgetProgressBar.style.backgroundColor = 'var(--color-expense)';
            } else if (totalPct > 80) {
                budgetProgressBar.style.backgroundColor = 'var(--color-warning)';
            } else {
                budgetProgressBar.style.backgroundColor = 'var(--color-primary)';
            }
        }

        // Status Tag & Alert Banner
        if (statusTag) {
            if (totalPct > 100) {
                statusTag.textContent = 'Exceeded Limit';
                statusTag.className = 'master-status-tag status-danger';
            } else if (totalPct > 80) {
                statusTag.textContent = 'High Utilization';
                statusTag.className = 'master-status-tag status-warning';
            } else {
                statusTag.textContent = 'Within Budget';
                statusTag.className = 'master-status-tag';
            }
        }

        if (alertBanner) {
            if (totalPct > 100) {
                alertBanner.classList.remove('hidden');
                alertBanner.className = 'budget-alert-banner alert-danger-theme';
                alertTitle.textContent = 'Critical Alert: Budget Exceeded!';
                alertDesc.textContent = `You have exceeded your overall monthly budget by ${formatCurrency(totalMonthSpent - totalBudget)}. Please curtail discretionary spending.`;
            } else if (totalPct >= 80) {
                alertBanner.classList.remove('hidden');
                alertBanner.className = 'budget-alert-banner';
                alertTitle.textContent = 'Budget Warning: 80% Threshold Reached';
                alertDesc.textContent = `You have utilized ${totalPct}% of your total budget. Only ${formatCurrency(totalRemaining)} remains for the rest of this month.`;
            } else {
                alertBanner.classList.add('hidden');
            }
        }

        // Category Budgets Grid
        renderCategoryBudgetsGrid(catSpend);
    }

    function renderCategoryBudgetsGrid(catSpend) {
        const grid = document.getElementById('categoryBudgetsGrid');
        if (!grid) return;

        const categoryLimits = state.budgets.categories || {};
        let html = '';

        // Iterate through all expense categories
        Object.keys(CATEGORIES).forEach(catKey => {
            const cat = CATEGORIES[catKey];
            if (!cat.isExpense) return;

            const limit = categoryLimits[catKey] || 5000;
            const spent = catSpend[catKey] || 0;
            const remaining = Math.max(0, limit - spent);
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;

            let badgeClass = 'text-success';
            let fillColor = 'var(--color-primary)';
            let statusText = 'Normal';

            if (pct > 100) {
                badgeClass = 'text-danger';
                fillColor = 'var(--color-expense)';
                statusText = 'Over Limit';
            } else if (pct > 80) {
                badgeClass = 'text-warning';
                fillColor = 'var(--color-warning)';
                statusText = 'Near Cap';
            }

            html += `
                <div class="cat-budget-card">
                    <div>
                        <div class="cat-budget-card-header">
                            <div class="cat-title-badge">
                                <div class="cat-icon-avatar" style="background-color: ${cat.bg}; color: ${cat.color};">
                                    <i class="fa-solid ${cat.icon}"></i>
                                </div>
                                <span class="cat-name-text">${cat.name}</span>
                            </div>
                            <span class="cat-pct-badge ${badgeClass}">${pct}%</span>
                        </div>

                        <div class="cat-budget-figures">
                            <span class="cat-spent-figure">${formatCurrency(spent)} spent</span>
                            <span class="cat-limit-figure">Cap: ${formatCurrency(limit)}</span>
                        </div>

                        <div class="cat-progress-track">
                            <div class="cat-progress-fill" style="width: ${Math.min(100, pct)}%; background-color: ${fillColor};"></div>
                        </div>
                    </div>

                    <div class="cat-card-footer">
                        <span>${statusText} • ${formatCurrency(remaining)} left</span>
                        <button class="btn-text-link" onclick="window.app.openBudgetModal()">
                            <i class="fa-solid fa-pen"></i> Adjust
                        </button>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }

    function openBudgetModal() {
        const modal = document.getElementById('budgetModal');
        const totalInput = document.getElementById('budgetTotalMonthlyInput');
        const inputsList = document.getElementById('categoryBudgetInputsList');

        if (!modal || !totalInput || !inputsList) return;

        updateCurrencySymbols();

        totalInput.value = state.budgets.monthlyTotal || 50000;

        // Render category budget input rows
        let html = '';
        Object.keys(CATEGORIES).forEach(catKey => {
            const cat = CATEGORIES[catKey];
            if (!cat.isExpense) return;

            const currentLimit = state.budgets.categories?.[catKey] || 5000;

            html += `
                <div class="cat-budget-input-row">
                    <div class="cat-input-label">
                        <i class="fa-solid ${cat.icon}" style="color: ${cat.color};"></i>
                        <span>${cat.name}</span>
                    </div>
                    <div class="cat-input-box input-with-addon">
                        <span class="addon-symbol">${CURRENCIES[state.settings.currency].symbol}</span>
                        <input type="number" class="form-control category-budget-field" data-cat="${catKey}" value="${currentLimit}" min="0" step="100">
                    </div>
                </div>
            `;
        });

        inputsList.innerHTML = html;
        modal.classList.remove('hidden');
    }

    function closeBudgetModal() {
        document.getElementById('budgetModal')?.classList.add('hidden');
    }

    function initBudgetModalEvents() {
        const modal = document.getElementById('budgetModal');
        const openBtn = document.getElementById('openEditBudgetModalBtn');
        const closeBtn = document.getElementById('closeBudgetModalBtn');
        const cancelBtn = document.getElementById('cancelBudgetModalBtn');
        const form = document.getElementById('budgetForm');

        openBtn?.addEventListener('click', openBudgetModal);
        closeBtn?.addEventListener('click', closeBudgetModal);
        cancelBtn?.addEventListener('click', closeBudgetModal);

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeBudgetModal();
        });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();

            const totalMonthly = parseFloat(document.getElementById('budgetTotalMonthlyInput').value) || 50000;
            const newCategoryBudgets = {};

            document.querySelectorAll('.category-budget-field').forEach(input => {
                const cat = input.dataset.cat;
                const val = parseFloat(input.value) || 0;
                newCategoryBudgets[cat] = val;
            });

            state.budgets = {
                monthlyTotal: totalMonthly,
                categories: newCategoryBudgets
            };

            saveToStorage();
            closeBudgetModal();
            renderActiveView(state.activeTab);
            showToast('Budgets updated successfully!', 'success');
        });
    }

    // ==========================================================================
    // 4. ANALYTICS SECTION CONTROLLER
    // ==========================================================================
    function renderAnalyticsView() {
        const periodTxs = getAnalyticsTransactions();
        const metrics = getFinancialMetrics(periodTxs);
        const catSpend = getSpendingByCategory(periodTxs);

        // Calculate KPI values
        let topCat = 'None';
        let topCatSpend = 0;
        let largestExpense = 0;
        let largestExpenseTitle = 'None';

        periodTxs.forEach(tx => {
            if (tx.type === 'expense') {
                const amt = parseFloat(tx.amount) || 0;
                if (amt > largestExpense) {
                    largestExpense = amt;
                    largestExpenseTitle = tx.title;
                }
            }
        });

        Object.keys(catSpend).forEach(cat => {
            if (catSpend[cat] > topCatSpend) {
                topCatSpend = catSpend[cat];
                topCat = cat;
            }
        });

        // Unique active transaction dates to calculate daily avg
        const activeDates = new Set(periodTxs.filter(t => t.type === 'expense').map(t => t.date));
        const activeDayCount = Math.max(1, activeDates.size);
        const avgDaily = metrics.totalExpenses / activeDayCount;

        // Render KPI Cards
        const kpiSavings = document.getElementById('kpiSavingsRate');
        const kpiTopCat = document.getElementById('kpiTopCategory');
        const kpiTopCatAmt = document.getElementById('kpiTopCategoryAmount');
        const kpiDailyAvg = document.getElementById('kpiDailyAvg');
        const kpiLargestExp = document.getElementById('kpiLargestExpense');
        const kpiLargestExpTitle = document.getElementById('kpiLargestExpenseTitle');

        if (kpiSavings) kpiSavings.textContent = `${metrics.savingsRate}%`;
        if (kpiTopCat) kpiTopCat.textContent = topCat;
        if (kpiTopCatAmt) kpiTopCatAmt.textContent = `${formatCurrency(topCatSpend)} spent`;
        if (kpiDailyAvg) kpiDailyAvg.textContent = formatCurrency(avgDaily);
        if (kpiLargestExp) kpiLargestExp.textContent = formatCurrency(largestExpense);
        if (kpiLargestExpTitle) kpiLargestExpTitle.textContent = largestExpenseTitle;

        // Render Charts
        renderAnalyticsCharts();

        // Render Behavioral Insights
        renderAnalyticsBehavioralInsights(metrics, topCat, topCatSpend, avgDaily, largestExpense);
    }

    function getAnalyticsTransactions() {
        const period = state.analyticsPeriod;
        const now = new Date();
        const currYear = now.getFullYear();
        const currMonth = now.getMonth() + 1;
        const pad = (n) => String(n).padStart(2, '0');

        switch (period) {
            case 'this_month':
                return state.transactions.filter(t => t.date && t.date.startsWith(`${currYear}-${pad(currMonth)}`));
            case 'last_3_months': {
                const threshold = new Date();
                threshold.setMonth(threshold.getMonth() - 3);
                return state.transactions.filter(t => new Date(t.date) >= threshold);
            }
            case 'this_year':
                return state.transactions.filter(t => t.date && t.date.startsWith(String(currYear)));
            case 'all':
            default:
                return [...state.transactions];
        }
    }

    function renderAnalyticsCharts() {
        if (typeof Chart === 'undefined') return;
        const theme = getChartThemeColors();

        // 1. Monthly Cashflow Bar Chart
        renderAnalyticsCashflowChart(theme);

        // 2. Category Spread Polar Area / Doughnut Chart
        renderAnalyticsCategoryPolarChart(theme);

        // 3. Budget vs Actual Spend Comparison Chart
        renderAnalyticsBudgetVsActualChart(theme);
    }

    function renderAnalyticsCashflowChart(theme) {
        const canvas = document.getElementById('chartAnalyticsMonthlyCashflow');
        if (!canvas) return;

        destroyChart('analyticsCashflow');

        // Last 6 months
        const monthMap = {};
        const monthKeys = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            monthMap[key] = { label, income: 0, expense: 0, savings: 0 };
            monthKeys.push(key);
        }

        state.transactions.forEach(tx => {
            if (!tx.date) return;
            const key = tx.date.substring(0, 7);
            if (monthMap[key]) {
                const amt = parseFloat(tx.amount) || 0;
                if (tx.type === 'income') monthMap[key].income += amt;
                else if (tx.type === 'expense') monthMap[key].expense += amt;
            }
        });

        monthKeys.forEach(k => {
            monthMap[k].savings = Math.max(0, monthMap[k].income - monthMap[k].expense);
        });

        const labels = monthKeys.map(k => monthMap[k].label);
        const incomeData = monthKeys.map(k => monthMap[k].income);
        const expenseData = monthKeys.map(k => monthMap[k].expense);
        const savingsData = monthKeys.map(k => monthMap[k].savings);

        state.charts['analyticsCashflow'] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: '#10B981',
                        borderRadius: 6
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: '#EF4444',
                        borderRadius: 6
                    },
                    {
                        label: 'Net Savings',
                        data: savingsData,
                        backgroundColor: '#8B5CF6',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: theme.textColor, font: { family: theme.fontFamily, weight: '600' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: theme.textColor, font: { family: theme.fontFamily } }
                    },
                    y: {
                        grid: { color: theme.gridColor },
                        ticks: {
                            color: theme.textColor,
                            font: { family: theme.fontFamily },
                            callback: (v) => formatCurrency(v, false)
                        }
                    }
                }
            }
        });
    }

    function renderAnalyticsCategoryPolarChart(theme) {
        const canvas = document.getElementById('chartAnalyticsCategoryPolar');
        if (!canvas) return;

        destroyChart('analyticsCategoryPolar');

        const catSpend = getSpendingByCategory(getAnalyticsTransactions());
        const labels = [];
        const data = [];
        const bgColors = [];

        Object.keys(catSpend).forEach(cat => {
            if (catSpend[cat] > 0) {
                labels.push(cat);
                data.push(catSpend[cat]);
                bgColors.push(CATEGORIES[cat]?.color || '#94A3B8');
            }
        });

        state.charts['analyticsCategoryPolar'] = new Chart(canvas, {
            type: 'polarArea',
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: bgColors.map(c => c + 'CC'),
                        borderColor: state.settings.theme === 'dark' ? '#1E293B' : '#FFFFFF',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: theme.textColor, font: { family: theme.fontFamily, size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.label}: ${formatCurrency(context.parsed.r)}`
                        }
                    }
                },
                scales: {
                    r: {
                        grid: { color: theme.gridColor },
                        ticks: { display: false }
                    }
                }
            }
        });
    }

    function renderAnalyticsBudgetVsActualChart(theme) {
        const canvas = document.getElementById('chartAnalyticsBudgetVsActual');
        if (!canvas) return;

        destroyChart('analyticsBudgetVsActual');

        const catSpend = getSpendingByCategory(getCurrentMonthTransactions());
        const budgets = state.budgets.categories || {};

        const labels = [];
        const actualData = [];
        const budgetData = [];

        Object.keys(CATEGORIES).forEach(catKey => {
            if (CATEGORIES[catKey].isExpense) {
                labels.push(catKey);
                actualData.push(catSpend[catKey] || 0);
                budgetData.push(budgets[catKey] || 5000);
            }
        });

        state.charts['analyticsBudgetVsActual'] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Current Spend',
                        data: actualData,
                        backgroundColor: '#EF4444',
                        borderRadius: 6
                    },
                    {
                        label: 'Budget Target',
                        data: budgetData,
                        backgroundColor: '#3B82F6',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: theme.textColor, font: { family: theme.fontFamily, weight: '600' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: theme.textColor, font: { family: theme.fontFamily } }
                    },
                    y: {
                        grid: { color: theme.gridColor },
                        ticks: {
                            color: theme.textColor,
                            font: { family: theme.fontFamily },
                            callback: (v) => formatCurrency(v, false)
                        }
                    }
                }
            }
        });
    }

    function renderAnalyticsBehavioralInsights(metrics, topCat, topCatSpend, avgDaily, largestExpense) {
        const list = document.getElementById('analyticsInsightsList');
        if (!list) return;

        const totalExpenses = metrics.totalExpenses || 1;
        const topCatPct = Math.round((topCatSpend / totalExpenses) * 100);

        list.innerHTML = `
            <div class="insight-item-box">
                <i class="fa-solid fa-chart-pie i-box-icon"></i>
                <div>
                    <h5 class="i-box-title">Dominant Expense Category</h5>
                    <p class="i-box-text"><strong>${topCat}</strong> is your largest cost center, consuming <strong>${topCatPct}%</strong> (${formatCurrency(topCatSpend)}) of your outflow in this timeframe.</p>
                </div>
            </div>

            <div class="insight-item-box">
                <i class="fa-solid fa-piggy-bank i-box-icon"></i>
                <div>
                    <h5 class="i-box-title">Savings Velocity</h5>
                    <p class="i-box-text">You are saving at a rate of <strong>${metrics.savingsRate}%</strong>. Financial planners recommend the 50/30/20 rule (at least 20% savings target).</p>
                </div>
            </div>

            <div class="insight-item-box">
                <i class="fa-solid fa-calendar-check i-box-icon"></i>
                <div>
                    <h5 class="i-box-title">Daily Expenditure Burn</h5>
                    <p class="i-box-text">Your average spending on active days is <strong>${formatCurrency(avgDaily)}</strong>. Keeping daily burns below ${formatCurrency(avgDaily * 0.9)} can yield substantial savings.</p>
                </div>
            </div>

            <div class="insight-item-box">
                <i class="fa-solid fa-money-bill-transfer i-box-icon"></i>
                <div>
                    <h5 class="i-box-title">High-Value Outliers</h5>
                    <p class="i-box-text">Your single largest expense transaction is <strong>${formatCurrency(largestExpense)}</strong>. One-time large purchases account for a notable share of overall volatility.</p>
                </div>
            </div>
        `;
    }

    function initAnalyticsEvents() {
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.analyticsPeriod = btn.dataset.period || 'all';
                renderAnalyticsView();
            });
        });
    }

    // ==========================================================================
    // 5. REPORTS SECTION CONTROLLER
    // ==========================================================================
    function renderReportsView() {
        const reportTxs = getReportTransactions();
        const metrics = getFinancialMetrics(reportTxs);
        const catSpend = getSpendingByCategory(reportTxs);

        // Header info
        const genDate = document.getElementById('reportGeneratedDate');
        const scopeText = document.getElementById('reportScopeText');
        const accountOwner = document.getElementById('reportAccountOwner');

        if (genDate) genDate.textContent = getTodayFormatted();
        if (scopeText) {
            const map = {
                current_month: 'Current Month',
                last_month: 'Last Month',
                year_to_date: 'Year to Date',
                all_time: 'All Time Summary'
            };
            scopeText.textContent = map[state.reportPeriod] || 'Current Month';
        }
        if (accountOwner) accountOwner.textContent = state.settings.userName || 'Account Holder';

        // Summary Boxes
        const repIncome = document.getElementById('reportTotalIncome');
        const repExpense = document.getElementById('reportTotalExpenses');
        const repSavings = document.getElementById('reportNetSavings');
        const repIncomeCount = document.getElementById('reportIncomeCount');
        const repExpenseCount = document.getElementById('reportExpenseCount');
        const repSavingsRate = document.getElementById('reportSavingsRateBadge');
        const repAdherence = document.getElementById('reportBudgetAdherence');
        const repBudgetStatus = document.getElementById('reportBudgetStatus');

        if (repIncome) repIncome.textContent = formatCurrency(metrics.totalIncome);
        if (repExpense) repExpense.textContent = formatCurrency(metrics.totalExpenses);
        if (repSavings) {
            repSavings.textContent = formatCurrency(metrics.totalBalance);
            repSavings.className = `r-stat-val ${metrics.totalBalance >= 0 ? 'text-success' : 'text-danger'}`;
        }
        if (repIncomeCount) repIncomeCount.textContent = `${metrics.incomeCount} Inflows`;
        if (repExpenseCount) repExpenseCount.textContent = `${metrics.expenseCount} Outflows`;
        if (repSavingsRate) repSavingsRate.textContent = `${metrics.savingsRate}% Savings Rate`;

        const totalBudget = state.budgets.monthlyTotal || 50000;
        const adherencePct = totalBudget > 0 ? Math.max(0, Math.round(((totalBudget - metrics.totalExpenses) / totalBudget) * 100)) : 100;
        if (repAdherence) repAdherence.textContent = `${adherencePct}%`;
        if (repBudgetStatus) {
            repBudgetStatus.textContent = metrics.totalExpenses > totalBudget ? 'Exceeded Monthly Cap' : 'Within Budget Cap';
            repBudgetStatus.className = `r-stat-note ${metrics.totalExpenses > totalBudget ? 'text-danger' : 'text-success'}`;
        }

        // 1. Category Breakdown Table
        renderReportCategoryTable(catSpend, metrics.totalExpenses);

        // 2. Itemized Ledger Table
        renderReportLedgerTable(reportTxs);
    }

    function getReportTransactions() {
        const period = state.reportPeriod;
        const now = new Date();
        const currYear = now.getFullYear();
        const currMonth = now.getMonth() + 1;
        const pad = (n) => String(n).padStart(2, '0');

        switch (period) {
            case 'current_month':
                return state.transactions.filter(t => t.date && t.date.startsWith(`${currYear}-${pad(currMonth)}`));
            case 'last_month': {
                const prevMonth = currMonth === 1 ? 12 : currMonth - 1;
                const prevYear = currMonth === 1 ? currYear - 1 : currYear;
                return state.transactions.filter(t => t.date && t.date.startsWith(`${prevYear}-${pad(prevMonth)}`));
            }
            case 'year_to_date':
                return state.transactions.filter(t => t.date && t.date.startsWith(String(currYear)));
            case 'all_time':
            default:
                return [...state.transactions];
        }
    }

    function renderReportCategoryTable(catSpend, totalExpenses) {
        const tableBody = document.getElementById('reportCategoryTableBody');
        if (!tableBody) return;

        const budgets = state.budgets.categories || {};
        const safeTotal = totalExpenses > 0 ? totalExpenses : 1;

        let html = '';
        Object.keys(CATEGORIES).forEach(catKey => {
            const cat = CATEGORIES[catKey];
            if (!cat.isExpense) return;

            const spent = catSpend[catKey] || 0;
            const pct = Math.round((spent / safeTotal) * 100);
            const budgetCap = budgets[catKey] || 5000;
            const isOver = spent > budgetCap;

            // Count transactions in this category for the report
            const txCount = getReportTransactions().filter(t => t.category === catKey && t.type === 'expense').length;

            html += `
                <tr>
                    <td>
                        <i class="fa-solid ${cat.icon}" style="color: ${cat.color}; margin-right: 6px;"></i>
                        <strong>${cat.name}</strong>
                    </td>
                    <td>${txCount}</td>
                    <td class="text-right"><strong>${formatCurrency(spent)}</strong></td>
                    <td class="text-right">${pct}%</td>
                    <td>
                        <span class="${isOver ? 'text-danger' : 'text-success'}">
                            ${isOver ? 'Exceeded (' + formatCurrency(spent - budgetCap) + ' over)' : 'Within limit'}
                        </span>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    function renderReportLedgerTable(reportTxs) {
        const tableBody = document.getElementById('reportLedgerTableBody');
        if (!tableBody) return;

        const sorted = [...reportTxs].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sorted.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No transactions found for this period.</td></tr>';
            return;
        }

        let html = '';
        sorted.forEach(tx => {
            const isIncome = tx.type === 'income';
            html += `
                <tr>
                    <td>${formatDate(tx.date)}</td>
                    <td>
                        <strong>${escapeHtml(tx.title)}</strong>
                        ${tx.description ? `<br><small class="text-muted">${escapeHtml(tx.description)}</small>` : ''}
                    </td>
                    <td>${escapeHtml(tx.category)}</td>
                    <td>
                        <span class="type-pill ${isIncome ? 'type-pill-income' : 'type-pill-expense'}">${escapeHtml(tx.type)}</span>
                    </td>
                    <td class="text-right ${isIncome ? 'amount-income' : 'amount-expense'}">
                        ${isIncome ? '+' : '-'} ${formatCurrency(tx.amount)}
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    function initReportsEvents() {
        const periodSelect = document.getElementById('reportPeriodSelect');
        const updateBtn = document.getElementById('generateReportBtn');
        const printBtn = document.getElementById('printReportBtn');
        const exportBtn = document.getElementById('exportReportCsvBtn');

        periodSelect?.addEventListener('change', (e) => {
            state.reportPeriod = e.target.value;
            renderReportsView();
        });

        updateBtn?.addEventListener('click', () => {
            renderReportsView();
            showToast('Financial report refreshed.', 'info');
        });

        printBtn?.addEventListener('click', () => {
            window.print();
        });

        exportBtn?.addEventListener('click', () => {
            exportTransactionsToCSV(getReportTransactions(), `smartspend-report-${state.reportPeriod}.csv`);
        });
    }

    // ==========================================================================
    // 6. SETTINGS SECTION CONTROLLER
    // ==========================================================================
    function renderSettingsView() {
        const currencySelect = document.getElementById('currencySelect');
        const userNameInput = document.getElementById('userNameInput');
        const savingsGoalInput = document.getElementById('monthlySavingsGoalInput');

        if (currencySelect) currencySelect.value = state.settings.currency || 'INR';
        if (userNameInput) userNameInput.value = state.settings.userName || 'Arshveer';
        if (savingsGoalInput) savingsGoalInput.value = state.settings.monthlySavingsGoal || 25000;

        updateCurrencySymbols();
    }

    function initSettingsEvents() {
        // Currency Selector
        const currencySelect = document.getElementById('currencySelect');
        currencySelect?.addEventListener('change', (e) => {
            const newCurr = e.target.value;
            if (CURRENCIES[newCurr]) {
                state.settings.currency = newCurr;
                saveToStorage();
                updateCurrencySymbols();
                updateGlobalBadges();
                renderActiveView(state.activeTab);
                showToast(`Currency updated to ${CURRENCIES[newCurr].name} (${CURRENCIES[newCurr].symbol})`, 'success');
            }
        });

        // User Profile Form
        const profileForm = document.getElementById('userProfileForm');
        profileForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('userNameInput').value.trim() || 'User';
            const goal = parseFloat(document.getElementById('monthlySavingsGoalInput').value) || 25000;

            state.settings.userName = name;
            state.settings.monthlySavingsGoal = goal;
            saveToStorage();
            updateGlobalBadges();
            showToast('Profile and savings goal updated!', 'success');
        });

        // Reset Demo Data Button
        document.getElementById('resetDemoDataBtn')?.addEventListener('click', async () => {
            const confirmed = await showConfirmModal({
                title: 'Reset to Demo Data?',
                message: 'This will replace your current transactions and budgets with realistic demo financial data.',
                confirmText: 'Reset Demo Data',
                isDanger: false
            });

            if (confirmed) {
                seedInitialData();
                renderActiveView(state.activeTab);
                updateGlobalBadges();
                showToast('Demo data restored successfully!', 'success');
            }
        });

        // Clear All Data Button
        document.getElementById('clearAllDataBtn')?.addEventListener('click', async () => {
            const confirmed = await showConfirmModal({
                title: 'Clear All Financial Data?',
                message: 'DANGER: This will permanently delete all your transactions. This action cannot be undone.',
                confirmText: 'Yes, Delete Everything',
                isDanger: true
            });

            if (confirmed) {
                state.transactions = [];
                saveToStorage();
                renderActiveView(state.activeTab);
                updateGlobalBadges();
                showToast('All transaction records have been erased.', 'warning');
            }
        });

        // Backup Export JSON
        document.getElementById('exportBackupJsonBtn')?.addEventListener('click', () => {
            exportFullBackupJSON();
        });
    }

    // --- Data Export Utilities (CSV & JSON) ---
    function exportTransactionsToCSV(transactionsList, fileName = 'smartspend-transactions.csv') {
        if (!transactionsList || transactionsList.length === 0) {
            showToast('No transactions to export.', 'warning');
            return;
        }

        const headers = ['Transaction ID', 'Title', 'Amount', 'Type', 'Category', 'Date', 'Description'];
        const rows = transactionsList.map(tx => [
            `"${tx.id}"`,
            `"${(tx.title || '').replace(/"/g, '""')}"`,
            tx.amount,
            `"${tx.type}"`,
            `"${tx.category}"`,
            `"${tx.date}"`,
            `"${(tx.description || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Exported ${transactionsList.length} transactions to CSV.`, 'success');
    }

    function exportFullBackupJSON() {
        const backupData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            settings: state.settings,
            budgets: state.budgets,
            transactions: state.transactions
        };

        const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const link = document.createElement('a');
        link.setAttribute('href', jsonStr);
        link.setAttribute('download', `smartspend-backup-${getTodayISODate()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Complete JSON backup downloaded.', 'success');
    }

    // --- Application Bootstrapper ---
    function init() {
        // 1. Load LocalStorage State
        loadFromStorage();

        // 2. Initialize Theme & Visual Defaults
        initTheme();
        updateCurrencySymbols();

        // 3. Initialize Event Handlers
        initConfirmModalEvents();
        initNavigation();
        initTransactionModalEvents();
        initBudgetModalEvents();
        initTransactionsEvents();
        initAnalyticsEvents();
        initReportsEvents();
        initSettingsEvents();

        // 4. Update Header Date & Global Badges
        updateGlobalBadges();

        // 5. Expose Global Helpers for inline onclick events
        window.app = {
            openTransactionModal,
            closeTransactionModal,
            editTransaction: (id) => openTransactionModal('expense', id),
            deleteTransaction,
            openBudgetModal,
            closeBudgetModal,
            formatCurrency
        };
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
