const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dns").setServers(["8.8.8.8"]);
require("dotenv").config();

const Expense = require("./expense");
const User = require("./user");
const authMiddleware = require("./authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const rateLimit = require("express-rate-limit");
// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://spend-wise-seven.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
});

app.use("/api", apiLimiter);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});
app.use("/api/auth/login", authLimiter);

// Health check
app.get("/", (req, res) => {
  res.send("Expense Tracker Backend is running!");
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "Expense Tracker API working successfully!",
  });
});

// ========================
// REGISTER
// ========================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
});

// ========================
// LOGIN
// ========================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        message: "Authentication configuration error",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
});

/* ========================
   MONTHLY BUDGET
======================== */

// Save or update the logged-in user's budget
app.put("/api/budget", authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Budget must be greater than zero",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { monthlyBudget: amount } },
      { new: true, runValidators: true },
    ).select("monthlyBudget");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Monthly budget saved successfully",
      monthlyBudget: user.monthlyBudget,
    });
  } catch (error) {
    console.error("Save budget error:", error.message);

    return res.status(500).json({
      message: "Failed to save monthly budget",
    });
  }
});

// Get the logged-in user's budget
app.get("/api/budget", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("monthlyBudget");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      monthlyBudget: user.monthlyBudget ?? 10000,
    });
  } catch (error) {
    console.error("Fetch budget error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch monthly budget",
    });
  }
});

// ========================
// ADD EXPENSE
// ========================
app.post("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        message: "Valid title, amount and category are required",
      });
    }

    const expenseData = {
      user: req.userId,
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
    };

    if (date !== undefined && date !== "") {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Valid date is required",
        });
      }

      expenseData.date = date;
    }

    const savedExpense = await Expense.create(expenseData);

    return res.status(201).json({
      message: "Expense saved successfully!",
      expense: savedExpense,
    });
  } catch (error) {
    console.error("Save expense error:", error.message);

    return res.status(500).json({
      message: "Failed to save expense",
    });
  }
});

// ========================
// GET LOGGED-IN USER EXPENSES
// ========================
app.get("/api/expenses", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(expenses);
  } catch (error) {
    console.error("Fetch expenses error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch expenses",
    });
  }
});

// ========================
// UPDATE OWN EXPENSE
// ========================
app.put("/api/expenses/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid expense ID",
      });
    }

    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Valid title is required",
        });
      }

      updates.title = title.trim();
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          message: "Amount must be greater than zero",
        });
      }

      updates.amount = numericAmount;
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          message: "Valid category is required",
        });
      }

      updates.category = category.trim();
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Valid date is required",
        });
      }

      updates.date = date;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "At least one valid field is required to update",
      });
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      {
        _id: id,
        user: req.userId,
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      message: "Expense updated successfully!",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("Update expense error:", error.message);

    return res.status(500).json({
      message: "Failed to update expense",
    });
  }
});

// ========================
// DELETE OWN EXPENSE
// ========================
app.delete("/api/expenses/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid expense ID",
      });
    }

    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!deletedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      message: "Expense deleted successfully!",
      expense: deletedExpense,
    });
  } catch (error) {
    console.error("Delete expense error:", error.message);

    return res.status(500).json({
      message: "Failed to delete expense",
    });
  }
});
// ========================
// AI EXPENSE INSIGHTS
// ========================

app.post("/api/ai/insights", authMiddleware, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key is missing from .env",
      });
    }

    // Load Gemini SDK without changing CommonJS configuration
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Fetch only the logged-in user's data
    const [expenses, user] = await Promise.all([
      Expense.find({ user: req.userId }).sort({ date: -1 }),
      User.findById(req.userId).select("monthlyBudget"),
    ]);

    const monthlyBudget = user?.monthlyBudget ?? 10000;

    // Current month's expenses
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const currentMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate < nextMonthStart;
    });

    const totalSpent = currentMonthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    );

    // Group spending by category
    const categoryTotals = {};

    currentMonthExpenses.forEach((expense) => {
      const category = expense.category || "Other";

      categoryTotals[category] =
        (categoryTotals[category] || 0) + Number(expense.amount || 0);
    });

    const spendingData = {
      month: now.toLocaleString("en-IN", {
        month: "long",
        year: "numeric",
      }),
      monthlyBudget,
      totalSpent,
      remainingBudget: monthlyBudget - totalSpent,
      categoryTotals,
      transactions: currentMonthExpenses.length,
    };

    if (currentMonthExpenses.length === 0) {
      return res.status(200).json({
        success: true,
        spendingData,
        insights:
          "Is month abhi koi expense record nahi hai. Expenses add karo, phir AI tumhari spending analyze kar payega.",
      });
    }

    const prompt = `
You are SpendWise, an intelligent personal finance assistant.

Analyze the following monthly expense summary carefully:

${JSON.stringify(spendingData)}

Instructions:

1. Reply in simple and natural Hinglish.
2. Start with a short monthly spending overview.
3. Clearly mention:
   - Monthly budget
   - Total amount spent
   - Remaining budget or overspending
4. Identify the highest spending category using actual data.
5. Compare total spending with the monthly budget.
6. If spending exceeds the budget, explain by how much.
7. If there are no expenses, clearly say that there is not enough spending data to analyze.
8. Give exactly 3 practical and personalized money-saving suggestions.
9. Suggestions must be based only on the provided data.
10. Never invent transactions, categories, amounts, or financial details.
11. Do not claim guaranteed savings.
12. Avoid repeating the same suggestion.
13. Use headings and bullet points for readability.
14. Keep the analysis clear, useful, and concise.

Important:
- Verify calculations using the provided numbers.
- Never assume missing values.
- This is general budgeting guidance, not professional financial advice.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.status(200).json({
      success: true,
      spendingData,
      insights: response.text,
    });
  } catch (error) {
    console.error("AI insights error:", error.message);

    return res.status(500).json({
      message: "AI insights generate nahi ho paaye. Thodi der baad try karo.",
    });
  }
});
// ========================
// CONNECT DATABASE & START SERVER
// =======================
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
