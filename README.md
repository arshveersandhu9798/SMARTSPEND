# SmartSpend – Personal Finance Tracker

> **Tagline:** Track Your Money. Control Your Future.

SmartSpend is a complete, modern, responsive personal finance management dashboard designed and built with **HTML5**, **CSS3**, and **Vanilla JavaScript**. It enables users to take full control of their personal finances through real-time cash flow tracking, dynamic budgeting, deep visual analytics, printable financial statements, and local data persistence.

---

## 🌟 Key Features

### 1. Main Dashboard
- **Executive Summary Cards**:
  - **Total Balance**: Live net worth calculation (`Income - Expenses`).
  - **Total Income**: Sum of all inflows with transaction counter badge.
  - **Total Expenses**: Sum of all outflows with transaction counter badge.
  - **Total Savings**: Net savings amount and savings rate (`%`) badge.
- **Smart Financial Insights**: Dynamic behavioral suggestions generated in real-time based on your transaction habits and budget status.
- **3 Interactive Chart.js Visualizations**:
  - **Income vs Expenses Bar Chart**: Monthly comparison of inflows and outflows.
  - **Expense Categories Doughnut Chart**: Categorical distribution of expenses.
  - **Monthly Spending Trend Line Chart**: Tracking spending behavior and fluctuations over time.
- **Recent Transactions Ledger**: Displays the 5 latest transactions with category icons, badges, amounts, and instant Edit/Delete controls.
- **Quick Budget Health Widgets**: Real-time progress bars for key spending categories (Food, Bills, Shopping).

### 2. Transactions Management
- **Full CRUD Operations**:
  - Add new income or expense with title, amount, category, date, and optional description.
  - Edit existing transactions with pre-populated values.
  - Delete transactions with a custom confirmation dialog.
- **Live Search & Multi-Filter Engine**:
  - Search by transaction title or notes.
  - Filter by Type: All, Income (+), Expense (-).
  - Filter by Category: Food, Shopping, Education, Transport, Entertainment, Health, Bills, Salary, Other.
  - Filter by Timeframe: All Time, This Month, Last Month, Last 30 Days, This Year, or Custom Date Range.
  - Sorting: Date (Newest/Oldest), Amount (High/Low), Title (A-Z).
- **Form Validation**: Prevents invalid or negative transaction amounts and highlights required fields.
- **Pagination & CSV Export**: Customizable page sizes (10, 25, 50, 100) and one-click CSV download.

### 3. Budget Planner
- **Monthly Master Budget**: Set and monitor an overall monthly spending ceiling.
- **Category-wise Budgets**: Allocate limits for Food, Shopping, Education, Transport, Entertainment, Health, Bills, and Other.
- **Real-Time Health Status & Progress Bars**:
  - 🟢 **Green (< 70%)**: Healthy spending.
  - 🟡 **Amber (70% - 90%)**: Warning – approaching budget limit.
  - 🔴 **Red (> 90% or > 100%)**: Critical alert – over budget.
- **Visual Alert Banners**: Warns the user when spending reaches 80% or exceeds 100% of the budget.

### 4. Financial Analytics & Insights
- **Key Performance Indicators (KPIs)**:
  - Net Savings Rate (`%`).
  - Dominant Expense Category with total spent.
  - Average Daily Expense across active days.
  - Single Largest Outflow transaction.
- **Advanced Charts**:
  - Monthly Cash Flow Breakdown (Income vs Expenses vs Net Savings).
  - Expense Category Spread (Polar Area Chart).
  - Budget vs Actual Spending comparison bar chart.
- **Behavioral Intelligence Panel**: Actionable observations about spending velocity and financial health.

### 5. Printable Financial Reports
- **Statement Generator**: Select between Current Month, Last Month, Year-to-Date, or All-Time.
- **Executive Statement Sheet**:
  - Clean statement header with account owner and timestamp.
  - Inflow, Outflow, Net Savings, and Budget Adherence statistics.
  - Category-wise Spending Breakdown table.
  - Complete Itemized Transactions Ledger.
  - Sign-off / verification block.
- **Print Ready**: Dedicated `@media print` CSS stylesheet strips away all navbars, sidebars, and UI clutter for crisp PDF or paper printing via the **Print Report** button.

### 6. Settings & Preferences
- **Multi-Currency Support**:
  - Indian Rupee (`₹ INR`) - Default
  - US Dollar (`$ USD`)
  - Euro (`€ EUR`)
  - British Pound (`£ GBP`)
  - Japanese Yen (`¥ JPY`)
  - Canadian Dollar (`$ CAD`)
  - Australian Dollar (`$ AUD`)
  - UAE Dirham (`د.إ AED`)
  - Changing the currency dynamically updates every balance, chart, and transaction immediately.
- **Theme Customization**: Clean Light Mode and sleek Dark Mode with instant toggle and persistence.
- **Profile & Savings Goal**: Set your display name and monthly target savings amount.
- **Data Management**:
  - **Reset Demo Data**: Restore realistic sample transactions and default budgets anytime.
  - **Export JSON Backup**: Download a complete backup of all transactions, budgets, and settings.
  - **Clear All Data**: Safe, double-confirmed purge of local data.

---

## 📁 Project Architecture & Files

```
SmartSpend/
│
├── index.html       # Semantic HTML5 single-page application structure
├── style.css        # Modern CSS3 stylesheet (Emerald theme, dark mode, print rules, responsive)
├── script.js        # Modular Vanilla JavaScript application controller & state engine
└── README.md        # Comprehensive documentation and user guide
```

---

## 🚀 How to Run Locally

Because SmartSpend is built using pure web standards (HTML5, CSS3, Vanilla JS), you can run it immediately without installing heavy build tools or dependencies like Node.js or Webpack.

### Option 1: Direct File Open (Easiest)
1. Double-click `index.html` or drag and drop it into any modern web browser (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge).

### Option 2: Python Built-in Web Server
Open your terminal in this directory and run:

```bash
# For Python 3
python3 -m http.server 8000
```

Then open your browser and navigate to:
```
http://localhost:8000
```

---

## 💾 LocalStorage Schema

SmartSpend automatically stores and syncs all changes in your browser's `localStorage`:

| Key | Description |
| :--- | :--- |
| `smartspend_transactions` | Array of transaction objects (`id`, `title`, `amount`, `type`, `category`, `date`, `description`) |
| `smartspend_budgets` | Object containing `monthlyTotal` and category-specific allowances |
| `smartspend_settings` | User preferences (`currency`, `theme`, `userName`, `monthlySavingsGoal`) |

*Note: If opened for the first time or if storage is cleared, realistic sample transactions spanning the current and previous months are automatically seeded to provide an immediate, rich experience.*

---

## 🎨 Color Palette

| Role | Color Name | Hex Code |
| :--- | :--- | :--- |
| **Primary Accent** | Emerald Green | `#10B981` |
| **Dark Green** | Forest Emerald | `#064E3B` |
| **Light Accent** | Mint Light | `#ECFDF5` |
| **Background (Light)** | Slate Light | `#F8FAFC` |
| **Background (Dark)** | Slate Dark | `#0B1120` |
| **Cards & Surfaces** | Pure White / Slate 800 | `#FFFFFF` / `#1E293B` |
| **Text (Primary)** | Dark Navy / Ice White | `#1E293B` / `#F8FAFC` |
| **Text (Secondary)** | Slate Grey | `#64748B` / `#94A3B8` |
| **Expense / Alert** | Coral Red | `#EF4444` |
| **Warning** | Amber Yellow | `#F59E0B` |
| **Income / Success** | Emerald Green | `#10B981` |


## 🔐 Sign-up and Login (Supabase)

This version includes `auth.html`, `auth.css`, `auth.js`, `app-auth.js`, and `supabase-config.js`. The dashboard checks for a valid Supabase session before loading. Local browser data is namespaced by the authenticated Supabase user ID, so accounts using the same browser profile do not share SmartSpend local data. This is browser-local storage, not cloud synchronization.

### Supabase setup
1. Create a project at https://supabase.com/.
2. In **Project Settings → API**, copy the Project URL and the **anon/public** key. Never use the `service_role` key in browser code.
3. Paste both values into `supabase-config.js`, replacing the two `YOUR_...` placeholders.
4. In **Authentication → URL Configuration**, add your website URL to Site URL and add the deployed `auth.html` / `index.html` URLs to Redirect URLs. For local testing, add `http://localhost:8000/**`.
5. In **Authentication → Providers → Email**, enable email/password sign-in. You can keep email confirmation enabled; users will need to confirm their email before logging in.
6. Serve the folder through a local web server (for example `python3 -m http.server 8000`) and open `http://localhost:8000/auth.html`. Do not rely on opening the files directly with `file://`.

**Important:** Authentication is handled by Supabase, but SmartSpend transaction/budget records still live in each user's browser LocalStorage. For secure cloud sync across devices, move financial records into Supabase database tables with Row Level Security policies that restrict every row to `auth.uid()`. Do not store sensitive financial data in a shared/public table.
