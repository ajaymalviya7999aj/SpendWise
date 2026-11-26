 
import { useEffect, useMemo, useRef, useState } from "react";
import Login from "./Login";
import Register from "./Register";
import {
  AreaChart,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./App.css";
import ReactMarkdown from "react-markdown";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ChartColumn,
  Sparkles,
  LogOut,
  Search,
  Bell,
  Settings,
  Pencil,
  Trash2,
  Plus,
  TrendingDown,
  PiggyBank,
  Target,
  IndianRupee,
  X,
  Utensils,
  Plane,
  ShoppingBag,
  GraduationCap,
  Receipt,
  HeartPulse,
  Ellipsis,
  TriangleAlert,
  CircleCheck,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/expenses";
const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Education",
  "Bills",
  "Health",
  "Other",
];

const COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", Icon: ArrowLeftRight },
  { id: "budget", label: "Budget", Icon: Wallet },
  { id: "analytics", label: "Analytics", Icon: ChartColumn },
  { id: "ai-insights", label: "AI Insights", Icon: Sparkles },
];
const NAV_IDS = NAV_ITEMS.map((item) => item.id);

const CATEGORY_ICONS = {
  Food: Utensils,
  Travel: Plane,
  Shopping: ShoppingBag,
  Education: GraduationCap,
  Bills: Receipt,
  Health: HeartPulse,
  Other: Ellipsis,
};

const categoryColor = (category) => {
  const index = categories.indexOf(category);
  return COLORS[(index === -1 ? categories.length - 1 : index) % COLORS.length];
};

const TOOLTIP_STYLE = {
  background: "#0f1626",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 12,
  color: "#f8fafc",
};

const today = () => new Date().toISOString().slice(0, 10);

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatCompact = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount) || 0);

function App() {
   const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [showRegister, setShowRegister] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState(() => {
    const savedIncome = localStorage.getItem("expenseTrackerIncome");
    return savedIncome ? Number(savedIncome) : 25000;
  });

  const [incomeInput, setIncomeInput] = useState(String(income));
  
const [monthlyBudget, setMonthlyBudget] = useState(10000);
const [budgetInput, setBudgetInput] = useState("10000");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: today(),
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
const [aiInsights, setAiInsights] = useState(null);
const [aiLoading, setAiLoading] = useState(false);
const [aiError, setAiError] = useState("");

  // 1. Backend se expenses fetch karo
   
useEffect(() => {
  if (!user) {
    setExpenses([]);
    setLoading(false);
    return;
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Login token nahi mila. Dobara login karo.");
      }

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Expenses load nahi ho paaye.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Backend se unexpected response mila.");
      }

      setExpenses(data);
    } catch (err) {
      setError(err.message || "Expenses load nahi ho paaye.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchExpenses();
}, [user]);

useEffect(() => {
  if (!user) {
    setMonthlyBudget(10000);
    setBudgetInput("10000");
    return;
  }

  const fetchBudget = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Login token nahi mila. Dobara login karo.");
      }

      const response = await fetch("http://localhost:5000/api/budget", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Monthly budget load nahi ho paaya.");
      }

      const data = await response.json();
      const budget = Number(data.monthlyBudget);

      if (!Number.isFinite(budget) || budget <= 0) {
        throw new Error("Backend se invalid budget mila.");
      }

      setMonthlyBudget(budget);
      setBudgetInput(String(budget));
    } catch (err) {
      console.error("Fetch budget error:", err);
      setError(err.message || "Monthly budget load nahi ho paaya.");
    }
  };

  fetchBudget();
}, [user]);

  // 2. Income ko localStorage mein save karo
  useEffect(() => {
    localStorage.setItem("expenseTrackerIncome", String(income));
  }, [income]);

  // 3. Total expenses
  const totalExpenses = useMemo(
    () =>
      expenses.reduce(
        (total, item) => total + (Number(item.amount) || 0),
        0
      ),
    [expenses]
  );

  // 4. Remaining balance
  const balance = income - totalExpenses;

  // 5. Savings percentage
  const savingsPercentage =
    income > 0 ? (balance / income) * 100 : 0;

  // 6. Spending percentage
  const spendingPercentage =
    income > 0 ? (totalExpenses / income) * 100 : 0;

  // 7. Selected month ke expenses
  const monthlyExpenses = useMemo(
    () =>
      expenses.filter(
        (item) => String(item.date || "").slice(0, 7) === selectedMonth
      ),
    [expenses, selectedMonth]
  );

  const monthlyTotal = useMemo(
    () =>
      monthlyExpenses.reduce(
        (total, item) => total + (Number(item.amount) || 0),
        0
      ),
    [monthlyExpenses]
  );

  // 8. Average expense
  const averageExpense =
    monthlyExpenses.length > 0
      ? monthlyTotal / monthlyExpenses.length
      : 0;

  // 9. Highest spending category
  const categoryTotals = useMemo(() => {
    const totals = {};

    monthlyExpenses.forEach((item) => {
      const category = item.category || "Other";
      totals[category] =
        (totals[category] || 0) + (Number(item.amount) || 0);
    });

    return totals;
  }, [monthlyExpenses]);

  const highestCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // 10. Search aur category filter
  const filteredExpenses = useMemo(() => {
    return [...expenses]
      .filter((item) => {
        const matchesSearch = String(item.title || "")
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchesCategory =
          selectedCategory === "All" ||
          item.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() -
          new Date(a.date || 0).getTime()
      );
  }, [expenses, search, selectedCategory]);

  // 11. Monthly chart data
  const monthlyChartData = useMemo(() => {
    const totals = {};

    expenses.forEach((item) => {
      const month = String(item.date || "").slice(0, 7);
      if (!month) return;

      totals[month] =
        (totals[month] || 0) + (Number(item.amount) || 0);
    });

    return Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        month,
        expenses: amount,
      }));
  }, [expenses]);

  // 12. Category-wise chart data
  const categoryChartData = Object.entries(categoryTotals).map(
    ([name, value]) => ({ name, value })
  );

  // 13. Add expense through backend POST API
  const handleAddExpense = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(form.amount);

    if (!form.title.trim()) {
      setError("Expense ka naam enter karo.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount zero se zyada hona chahiye.");
      return;
    }

    if (!form.date) {
      setError("Date select karo.");
      return;
    }

     
try {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Login token nahi mila. Dobara login karo.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: form.title.trim(),
      amount,
      category: form.category,
      date: form.date,
    }),
  });


      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Expense add nahi hua.");
      }

      // Backend response mein saved expense aana chahiye
      const savedExpense = result.expense || result;

      setExpenses((previous) => [...previous, savedExpense]);

      setForm({
        title: "",
        amount: "",
        category: "Food",
        date: today(),
      });

      setSuccess("Expense successfully add ho gaya!");
    } catch (err) {
      setError(
        err.message ||
          "Expense save nahi hua. Backend aur API route check karo."
      );
      console.error("Add expense error:", err);
    }
  };

  // 14. Income update
  const handleIncomeUpdate = (event) => {
    event.preventDefault();

    const value = Number(incomeInput);

    if (!Number.isFinite(value) || value < 0) {
      setError("Valid income enter karo.");
      return;
    }

    setIncome(value);
    setSuccess("Income update ho gayi!");
    setError("");
  };

  // Edit/Delete backend ke PUT aur DELETE API routes use karte hain.
  
  // Edit expense
 
const handleEdit = async (item) => {
  const newTitle = window.prompt("Expense ka naya naam:", item.title);
  if (newTitle === null) return;

  const newAmountInput = window.prompt(
    "Naya amount:",
    String(item.amount)
  );
  if (newAmountInput === null) return;

  const newAmount = Number(newAmountInput);

  if (!newTitle.trim()) {
    setError("Expense ka naam khali nahi ho sakta.");
    return;
  }

  if (!Number.isFinite(newAmount) || newAmount <= 0) {
    setError("Amount zero se zyada hona chahiye.");
    return;
  }

  try {
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Login token nahi mila. Dobara login karo.");
    }

    const response = await fetch(`${API_URL}/${item._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newTitle.trim(),
        amount: newAmount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Expense update nahi hua.");
    }

    const updatedExpense = result.expense || result;

    setExpenses((previous) =>
      previous.map((expense) =>
        expense._id === item._id ? updatedExpense : expense
      )
    );

    setSuccess("Expense successfully update ho gaya!");
  } catch (err) {
    setError(err.message || "Expense update nahi ho paaya.");
  }
};


  // Delete expense
   
const handleDelete = async (item) => {
  const confirmed = window.confirm(
    `Kya tum "${item.title}" expense delete karna chahte ho?`
  );

  if (!confirmed) return;

  try {
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Login token nahi mila. Dobara login karo.");
    }

    const response = await fetch(`${API_URL}/${item._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Expense delete nahi hua.");
    }

    setExpenses((previous) =>
      previous.filter((expense) => expense._id !== item._id)
    );

    setSuccess("Expense successfully delete ho gaya!");
  } catch (err) {
    setError(err.message || "Expense delete nahi ho paaya.");
  }
};

const fetchAIInsights = async () => {
  try {
    setAiLoading(true);
    setAiError("");
    setAiInsights(null);

    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please login again.");
    }

    const response = await fetch(
      "http://localhost:5000/api/ai/insights",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load AI insights");
    }

    setAiInsights(data.insights);

  } catch (error) {
    setAiError(error.message);
  } finally {
    setAiLoading(false);
  }
};

  // ---------------------------------------------------------------------
  // Redesign shell helpers (UI-only: navigation, notifications, derived
  // display values). None of this changes data fetching or calculations.
  // ---------------------------------------------------------------------
  const [activeNav, setActiveNav] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  // After a nav click, ignore scroll-spy updates while the smooth scroll runs.
  const navLockUntil = useRef(0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setExpenses([]);
    setError("");
    setSuccess("");
  };

  const goTo = (id, focusSelector) => {
    setNotifOpen(false);
    if (NAV_IDS.includes(id)) {
      setActiveNav(id);
      navLockUntil.current = Date.now() + 1200;
    }
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (focusSelector) {
      window.setTimeout(() => {
        document
          .querySelector(focusSelector)
          ?.focus({ preventScroll: true });
      }, 450);
    }
  };

  // Highlight the sidebar item for the section currently in view.
  useEffect(() => {
    if (!user) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            window.scrollY >= 120 &&
            Date.now() > navLockUntil.current
          ) {
            setActiveNav(entry.target.id);
          }
        });
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );

    NAV_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Near the top of the page the Dashboard item is always the active one.
    const handleScroll = () => {
      if (window.scrollY < 120 && Date.now() > navLockUntil.current) {
        setActiveNav("dashboard");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [user]);

  const displayName = user?.name || user?.email || "there";
  const avatarLetter = String(displayName).trim().charAt(0).toUpperCase();

  // Same thresholds as the original budget status message.
  const budgetPercent =
    monthlyBudget > 0 ? (monthlyTotal / monthlyBudget) * 100 : 0;
  const budgetLevel =
    monthlyTotal >= monthlyBudget
      ? "danger"
      : monthlyTotal >= monthlyBudget * 0.8
      ? "warning"
      : "safe";

  // Notifications are derived from real budget / income data only.
  const alerts = [];
  if (budgetLevel === "danger") {
    alerts.push("Monthly budget has been exceeded.");
  } else if (budgetLevel === "warning") {
    alerts.push("You have used 80% or more of your monthly budget.");
  }
  if (spendingPercentage > 100) {
    alerts.push("Total expenses are higher than your income.");
  }

  // Recent activity: latest saved expenses (same order the API returns).
  const recentActivity = [...expenses]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.date || 0).getTime() -
        new Date(a.createdAt || a.date || 0).getTime()
    )
    .slice(0, 5);

  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference *
    (1 - Math.min(Math.max(budgetPercent, 0), 100) / 100);

 if (!user) {
    return showRegister ? (
      <Register
        onRegister={() => {
          setShowRegister(false);
        }}
        onShowLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onLogin={(loggedInUser) => setUser(loggedInUser)}
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }
  return (
    <div className="app-shell">
      <div className="frame">
        {/* ---------------- Sidebar ---------------- */}
        <nav className="sidebar" aria-label="Primary">
          <a
            href="#dashboard"
            className="sidebar-logo"
            aria-label="SpendWise home"
            onClick={(e) => {
              e.preventDefault();
              goTo("dashboard");
            }}
          >
            <span className="logo-mark">₹</span>
          </a>

          <div className="sidebar-links">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                title={label}
                className={`sidebar-link ${activeNav === id ? "active" : ""}`}
                aria-current={activeNav === id ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(id);
                }}
              >
                <Icon size={21} strokeWidth={1.9} />
                <span>{label}</span>
              </a>
            ))}
          </div>

          <button
            type="button"
            title="Logout"
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={21} strokeWidth={1.9} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="content">
          <div className="dashboard-grid">
            {/* ============ Main column ============ */}
            <div className="main-column">
              {/* Header */}
              <header className="topbar" id="dashboard">
                <label className="search-box">
                  <Search size={16} />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") goTo("transactions");
                    }}
                    placeholder="Search transactions..."
                    aria-label="Search transactions"
                  />
                </label>

                <div className="topbar-welcome">
                  <span>Welcome back,</span>
                  <strong>{displayName}</strong>
                </div>
              </header>

              {error && (
                <div role="alert" className="banner banner-error">
                  {error}
                </div>
              )}

              {success && (
                <div role="status" className="banner banner-success">
                  {success}
                </div>
              )}

              {/* Summary cards */}
              <section aria-label="Summary">
                <div className="section-title">
                  <h2>My Cards</h2>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => goTo("add-expense", "#expense-title")}
                  >
                    Add expense →
                  </button>
                </div>

                <div className="summary-cards">
                  <article className="summary-card card-income">
                    <div className="summary-top">
                      <span className="card-label">Total Income</span>
                      <span className="card-icon">
                        <Wallet size={16} />
                      </span>
                    </div>
                    <h2>{formatMoney(income)}</h2>
                    <p className="card-note">Monthly income</p>
                    <div className="card-foot">
                      <span>{displayName}</span>
                      <span>{selectedMonth}</span>
                    </div>
                  </article>

                  <article className="summary-card card-expense">
                    <div className="summary-top">
                      <span className="card-label">Total Expenses</span>
                      <span className="card-icon">
                        <TrendingDown size={16} />
                      </span>
                    </div>
                    <h2>{formatMoney(totalExpenses)}</h2>
                    <p className="card-note">
                      {spendingPercentage.toFixed(1)}% of income spent
                    </p>
                    <div className="card-foot">
                      <span>{displayName}</span>
                      <span>{selectedMonth}</span>
                    </div>
                  </article>

                  <article className="summary-card card-balance">
                    <div className="summary-top">
                      <span className="card-label">Remaining Balance</span>
                      <span className="card-icon">
                        <PiggyBank size={16} />
                      </span>
                    </div>
                    <h2>{formatMoney(balance)}</h2>
                    <p className="card-note">
                      {savingsPercentage.toFixed(1)}% savings rate
                    </p>
                    <div className="card-foot">
                      <span>{displayName}</span>
                      <span>{selectedMonth}</span>
                    </div>
                  </article>
                </div>
              </section>

              {/* Row: transactions + category chart */}
              <div className="row-split">
                <section id="transactions" className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Recent Transactions</h2>
                      <p className="subtitle">
                        Total {filteredExpenses.length} transaction(s)
                      </p>
                    </div>

                    <div className="filters">
                      {search && (
                        <button
                          type="button"
                          className="chip"
                          onClick={() => setSearch("")}
                          aria-label="Clear search"
                        >
                          “{search}” <X size={13} />
                        </button>
                      )}

                      <select
                        value={selectedCategory}
                        aria-label="Filter by category"
                        onChange={(event) =>
                          setSelectedCategory(event.target.value)
                        }
                      >
                        <option value="All">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <p className="empty">Expenses load ho rahe hain...</p>
                  ) : filteredExpenses.length === 0 ? (
                    <p className="empty">
                      Koi expense nahi mila. Pehla expense add karke dekho.
                    </p>
                  ) : (
                    <div className="table-scroll">
                      <table className="transactions-table">
                        <thead>
                          <tr>
                            <th>Expense</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th className="num">Amount</th>
                            <th className="num">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredExpenses.map((item) => {
                            const Icon =
                              CATEGORY_ICONS[item.category] || Receipt;
                            const color = categoryColor(item.category);

                            return (
                              <tr key={item._id || item.id}>
                                <td data-label="Expense">
                                  <span className="tx-name">
                                    <span
                                      className="tx-icon"
                                      style={{
                                        color,
                                        background: `${color}22`,
                                      }}
                                    >
                                      <Icon size={16} />
                                    </span>
                                    {item.title}
                                  </span>
                                </td>
                                <td data-label="Category">
                                  <span
                                    className="pill"
                                    style={{
                                      color,
                                      background: `${color}1f`,
                                    }}
                                  >
                                    {item.category}
                                  </span>
                                </td>
                                <td data-label="Date">
                                  {String(item.date || "").slice(0, 10)}
                                </td>
                                <td data-label="Amount" className="num amount">
                                  −{formatMoney(item.amount)}
                                </td>
                                <td data-label="Actions" className="num">
                                  <span className="row-actions">
                                    <button
                                      type="button"
                                      className="icon-btn small"
                                      aria-label={`Edit ${item.title}`}
                                      onClick={() => handleEdit(item)}
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      className="icon-btn small danger"
                                      aria-label={`Delete ${item.title}`}
                                      onClick={() => handleDelete(item)}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section id="analytics" className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Category-wise Expenses</h2>
                      <p className="subtitle">{selectedMonth}</p>
                    </div>
                  </div>

                  {categoryChartData.length > 0 ? (
                    <>
                      <div className="donut-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryChartData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius="64%"
                              outerRadius="92%"
                              paddingAngle={3}
                              stroke="none"
                            >
                              {categoryChartData.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={TOOLTIP_STYLE}
                              formatter={(value) => formatMoney(value)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center">
                          <small>Total</small>
                          <strong>{formatCompact(monthlyTotal)}</strong>
                        </div>
                      </div>

                      <ul className="legend-list">
                        {categoryChartData.map((entry, index) => (
                          <li key={entry.name}>
                            <span
                              className="dot"
                              style={{
                                background: COLORS[index % COLORS.length],
                              }}
                            />
                            <span className="legend-name">{entry.name}</span>
                            <strong>{formatMoney(entry.value)}</strong>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="empty">No category data available.</p>
                  )}
                </section>
              </div>

              {/* Row: statistics + monthly insights */}
              <div className="row-split">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Monthly Expense Statistics</h2>
                      <p className="subtitle">Last 6 months</p>
                    </div>

                    <div className="stat-legend">
                      <span>
                        <i className="sq sq-purple" />
                        <small>Income</small>
                        <strong>{formatMoney(income)}</strong>
                      </span>
                      <span>
                        <i className="sq sq-orange" />
                        <small>Expenses</small>
                        <strong>{formatMoney(totalExpenses)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyChartData}>
                        <defs>
                          <linearGradient
                            id="areaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#fb923c"
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="100%"
                              stopColor="#fb923c"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="rgba(148,163,184,0.12)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="transparent"
                          tick={{ fill: "#8b97ad", fontSize: 12 }}
                        />
                        <YAxis
                          stroke="transparent"
                          tick={{ fill: "#8b97ad", fontSize: 12 }}
                          tickFormatter={(value) => formatCompact(value)}
                          domain={[
                            0,
                            (max) => Math.ceil(Math.max(max, income) * 1.1),
                          ]}
                        />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          formatter={(value) => formatMoney(value)}
                        />
                        <ReferenceLine
                          y={income}
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                        />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          name="Expenses"
                          stroke="#fb923c"
                          strokeWidth={3}
                          fill="url(#areaGradient)"
                          dot={{ r: 4, fill: "#fb923c", strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section id="insights" className="panel">
                  <div className="panel-head">
                    <h2>Monthly Insights</h2>
                    <input
                      type="month"
                      value={selectedMonth}
                      aria-label="Select month"
                      onChange={(event) => setSelectedMonth(event.target.value)}
                    />
                  </div>

                  <div className="insight-grid">
                    <article className="insight-card">
                      <p>Monthly Expenses</p>
                      <h3 className="orange">{formatMoney(monthlyTotal)}</h3>
                    </article>

                    <article className="insight-card">
                      <p>Average Expense</p>
                      <h3 className="purple">{formatMoney(averageExpense)}</h3>
                      <small>{monthlyExpenses.length} transaction(s)</small>
                    </article>

                    <article className="insight-card">
                      <p>Highest Spending</p>
                      <h3>{highestCategory ? highestCategory[0] : "No data"}</h3>
                      <small>
                        {highestCategory
                          ? formatMoney(highestCategory[1])
                          : "Is month koi expense nahi"}
                      </small>
                    </article>
                  </div>
                </section>
              </div>

              {/* Add expense */}
              <section id="add-expense" className="panel">
                <div className="panel-head">
                  <h2>Add New Expense</h2>
                </div>

                <form onSubmit={handleAddExpense} className="form-row">
                  <input
                    id="expense-title"
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    placeholder="Expense name, e.g. Groceries"
                    maxLength={100}
                    aria-label="Expense name"
                    required
                  />

                  <input
                    type="number"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({ ...form, amount: event.target.value })
                    }
                    placeholder="Amount ₹"
                    aria-label="Amount"
                    min="0.01"
                    step="0.01"
                    required
                  />

                  <select
                    value={form.category}
                    aria-label="Category"
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={form.date}
                    aria-label="Date"
                    onChange={(event) =>
                      setForm({ ...form, date: event.target.value })
                    }
                    required
                  />

                  <button type="submit" className="btn btn-primary">
                    <Plus size={16} /> Add Expense
                  </button>
                </form>
              </section>

              {/* AI insights */}
              <section id="ai-insights" className="panel ai-panel">
                <div className="panel-head">
                  <div>
                    <h2>
                      <Sparkles size={18} className="inline-icon" /> AI
                      Financial Insights
                    </h2>
                    <p className="subtitle">
                      Get smart suggestions based on your spending.
                    </p>
                  </div>

                  <button
                    id="ai-generate-btn"
                    type="button"
                    className="btn btn-primary"
                    onClick={fetchAIInsights}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Analyzing..." : "Generate AI Insights"}
                  </button>
                </div>

                {aiError && <p className="error-message">{aiError}</p>}

                {aiInsights && (
                  <div className="ai-insights-result">
                    <h3>✨ Your AI Suggestions</h3>

                    <div className="ai-markdown">
                      <ReactMarkdown>{aiInsights}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* ============ Right column ============ */}
            <aside className="side-column">
              <div className="side-top">
                <div className="profile-chip">
                  <span className="avatar">{avatarLetter}</span>
                  <span className="profile-meta">
                    <strong>{user?.name || "Account"}</strong>
                    {user?.email && <small>{user.email}</small>}
                  </span>
                </div>

                <div className="side-top-actions">
                  <button
                    type="button"
                    className="icon-btn plain"
                    aria-label="Income and budget settings"
                    onClick={() => goTo("budget", "#budget-input")}
                  >
                    <Settings size={18} />
                  </button>

                  <div className="notif-wrap">
                    <button
                      type="button"
                      className="icon-btn plain"
                      aria-label={`Notifications (${alerts.length})`}
                      aria-expanded={notifOpen}
                      onClick={() => setNotifOpen((open) => !open)}
                    >
                      <Bell size={18} />
                      {alerts.length > 0 && (
                        <span className="notif-badge">{alerts.length}</span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="notif-menu" role="menu">
                        <p className="notif-title">Notifications</p>
                        {alerts.length === 0 ? (
                          <p className="notif-empty">
                            <CircleCheck size={16} /> You're all caught up.
                          </p>
                        ) : (
                          alerts.map((message) => (
                            <p className="notif-item" key={message}>
                              <TriangleAlert size={16} /> {message}
                            </p>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Budget summary */}
              <section id="budget" className="plain-block">
                <div className="section-title">
                  <h2>Monthly Budget Summary</h2>
                </div>

                <form
                  className="form-stack"
                  onSubmit={async (event) => {
                    event.preventDefault();

                    const amount = Number(budgetInput);

                    if (!Number.isFinite(amount) || amount <= 0) {
                      setError("Budget amount 0 se zyada hona chahiye.");
                      setSuccess("");
                      return;
                    }

                    try {
                      setError("");
                      setSuccess("");

                      const token = localStorage.getItem("token");

                      if (!token) {
                        throw new Error(
                          "Login token nahi mila. Dobara login karo."
                        );
                      }

                      const response = await fetch(
                        "http://localhost:5000/api/budget",
                        {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ amount }),
                        }
                      );

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          data.message || "Budget save nahi ho paaya."
                        );
                      }

                      setMonthlyBudget(Number(data.monthlyBudget));
                      setBudgetInput(String(data.monthlyBudget));
                      setSuccess(
                        "Monthly budget MongoDB mein successfully save ho gaya!"
                      );
                    } catch (err) {
                      setError(err.message || "Budget save nahi ho paaya.");
                      console.error("Save budget error:", err);
                    }
                  }}
                >
                  <input
                    id="budget-input"
                    type="number"
                    min="1"
                    step="0.01"
                    value={budgetInput}
                    onChange={(event) => setBudgetInput(event.target.value)}
                    placeholder="Enter monthly budget ₹"
                    aria-label="Monthly budget"
                    required
                  />

                  <button type="submit" className="btn btn-primary">
                    Save Budget
                  </button>
                </form>

                <div className="budget-details">
                  <div className="budget-detail-row">
                    <span>Monthly Budget</span>
                    <strong>{formatMoney(monthlyBudget)}</strong>
                  </div>

                  <div className="budget-detail-row">
                    <span>This Month's Spending</span>
                    <strong>{formatMoney(monthlyTotal)}</strong>
                  </div>

                  <div className="budget-detail-row">
                    <span>Remaining Budget</span>
                    <strong
                      className={
                        monthlyTotal > monthlyBudget
                          ? "budget-danger"
                          : "budget-remaining"
                      }
                    >
                      {formatMoney(monthlyBudget - monthlyTotal)}
                    </strong>
                  </div>
                </div>
              </section>

              {/* Budget progress */}
              <section className="plain-block">
                <div className="section-title">
                  <h2>Budget Progress</h2>
                </div>

                <div className="ring-wrap">
                  <svg
                    viewBox="0 0 140 140"
                    className="ring"
                    aria-hidden="true"
                  >
                    <circle
                      className="ring-track"
                      cx="70"
                      cy="70"
                      r={ringRadius}
                    />
                    <circle
                      className={`ring-value ring-${budgetLevel}`}
                      cx="70"
                      cy="70"
                      r={ringRadius}
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className="ring-label">
                    <strong>{Math.round(budgetPercent)}%</strong>
                    <span>used</span>
                  </div>
                </div>

                <div className="progress-track" aria-hidden="true">
                  <div
                    className={`progress-fill fill-${budgetLevel}`}
                    style={{
                      width: `${Math.min(Math.max(budgetPercent, 0), 100)}%`,
                    }}
                  />
                </div>

                <p className={`budget-status status-${budgetLevel}`}>
                  {monthlyTotal >= monthlyBudget
                    ? "⚠️ Budget cross ho gaya! Spending kam karne ki koshish karo."
                    : monthlyTotal >= monthlyBudget * 0.8
                    ? "⚠️ Alert: Tumne monthly budget ka 80% use kar liya hai."
                    : "✅ Tum budget ke andar ho."}
                </p>
              </section>

              {/* Income */}
              <section id="income" className="plain-block">
                <div className="section-title">
                  <h2>Monthly Income</h2>
                </div>

                <form onSubmit={handleIncomeUpdate} className="form-stack">
                  <input
                    id="income-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={incomeInput}
                    onChange={(event) => setIncomeInput(event.target.value)}
                    placeholder="Monthly income"
                    aria-label="Monthly income"
                    required
                  />

                  <button type="submit" className="btn btn-primary">
                    Update Income
                  </button>
                </form>

                <p className="muted-text">
                  Income ka <strong>{spendingPercentage.toFixed(1)}%</strong>{" "}
                  expenses mein use hua hai.
                </p>

                <div className="progress-track" aria-hidden="true">
                  <div
                    className={`progress-fill ${
                      spendingPercentage > 100 ? "fill-danger" : "fill-accent"
                    }`}
                    style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
                  />
                </div>

                {spendingPercentage > 100 && (
                  <p className="status-danger small-warning">
                    Warning: Expenses tumhari income se zyada hain.
                  </p>
                )}
              </section>

              {/* Recent activity */}
              <section className="plain-block">
                <div className="section-title">
                  <h2>Recent Activity</h2>
                </div>

                {recentActivity.length === 0 ? (
                  <p className="empty">No activity yet.</p>
                ) : (
                  <ul className="activity-list">
                    {recentActivity.map((item) => {
                      const Icon = CATEGORY_ICONS[item.category] || Receipt;
                      const color = categoryColor(item.category);

                      return (
                        <li key={item._id || item.id}>
                          <span
                            className="tx-icon"
                            style={{ color, background: `${color}22` }}
                          >
                            <Icon size={16} />
                          </span>
                          <span className="activity-text">
                            <strong>{item.title}</strong>
                            <small>
                              {item.category} ·{" "}
                              {String(item.date || "").slice(0, 10)}
                            </small>
                          </span>
                          <span className="amount">
                            −{formatMoney(item.amount)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Quick actions */}
              <section className="plain-block">
                <div className="section-title">
                  <h2>Quick Actions</h2>
                </div>

                <div className="quick-grid">
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => goTo("add-expense", "#expense-title")}
                  >
                    <span className="quick-icon">
                      <Plus size={20} />
                    </span>
                    Add Expense
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => goTo("income", "#income-input")}
                  >
                    <span className="quick-icon">
                      <IndianRupee size={20} />
                    </span>
                    Update Income
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => goTo("budget", "#budget-input")}
                  >
                    <span className="quick-icon">
                      <Target size={20} />
                    </span>
                    Manage Budget
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => goTo("ai-insights", "#ai-generate-btn")}
                  >
                    <span className="quick-icon">
                      <Sparkles size={20} />
                    </span>
                    AI Insights
                  </button>
                </div>
              </section>
            </aside>
          </div>

          <footer className="app-footer">
            <p>Take control of your money, one expense at a time.</p>
            <p className="copyright">
              © {new Date().getFullYear()} SpendWise · Built with MERN Stack
              &amp; AI
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
