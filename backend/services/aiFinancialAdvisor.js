const { analyzeSpendingPatterns } = require("./spendingPatternDetector");
const { getBudgetRecommendations } = require("./budgetRecommender");
const { categorizeTransactions } = require("./transactionCategorizer");

class AIFinancialAdvisor {
  async analyzeTransactions(transactions) {
    try {
      // Calculate basic financial metrics
      const metrics = this.calculateFinancialMetrics(transactions);

      // Get spending patterns
      const patterns = await analyzeSpendingPatterns(transactions);

      // Get budget recommendations
      const recommendations = await getBudgetRecommendations(metrics);

      // Generate personalized advice
      const advice = this.generateFinancialAdvice(
        metrics,
        patterns,
        recommendations
      );

      return {
        metrics,
        patterns,
        recommendations,
        advice,
      };
    } catch (error) {
      console.error("Error in AI financial analysis:", error);
      throw error;
    }
  }

  calculateFinancialMetrics(transactions) {
    const metrics = {
      totalIncome: 0,
      totalExpenses: 0,
      savingsRate: 0,
      topExpenseCategories: {},
      unusualTransactions: [],
    };

    // Calculate totals and categorize transactions
    transactions.forEach((transaction) => {
      // Handle both string and number types for amount
      const amount =
        typeof transaction.amount === "string"
          ? parseFloat(transaction.amount.replace(/[^0-9.-]+/g, ""))
          : parseFloat(transaction.amount);

      if (isNaN(amount)) {
        console.warn("Invalid amount found:", transaction);
        return; // Skip invalid amounts
      }

      if (transaction.type === "income") {
        metrics.totalIncome += amount;
      } else {
        metrics.totalExpenses += amount;

        // Track expenses by category
        const category = transaction.category || "Uncategorized";
        metrics.topExpenseCategories[category] =
          (metrics.topExpenseCategories[category] || 0) + amount;

        // Identify unusual transactions (over $1000 or 50% higher than average for category)
        if (amount > 1000) {
          metrics.unusualTransactions.push({
            ...transaction,
            amount: amount, // Use the parsed amount
          });
        }
      }
    });

    // Calculate savings rate (avoid division by zero)
    metrics.savingsRate =
      metrics.totalIncome > 0
        ? ((metrics.totalIncome - metrics.totalExpenses) /
            metrics.totalIncome) *
          100
        : 0;

    // Sort expense categories by amount
    metrics.topExpenseCategories = Object.entries(metrics.topExpenseCategories)
      .sort(([, a], [, b]) => b - a)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

    return metrics;
  }

  generateFinancialAdvice(metrics, patterns, recommendations) {
    const advice = [];

    // Savings Rate Advice
    if (metrics.savingsRate < 20) {
      advice.push({
        type: "warning",
        message:
          "Your savings rate is below the recommended 20%. Consider reducing non-essential expenses.",
        action:
          "Review your top expense categories and identify areas for potential savings.",
      });
    } else {
      advice.push({
        type: "success",
        message: "Great job maintaining a healthy savings rate!",
        action: "Consider investing your savings for long-term growth.",
      });
    }

    // Expense Category Analysis
    const topCategories = Object.entries(metrics.topExpenseCategories).slice(
      0,
      3
    );
    if (topCategories.length > 0) {
      advice.push({
        type: "insight",
        message: `Your top ${
          topCategories.length
        } expense categories are: ${topCategories
          .map(([cat, amount]) => `${cat} ($${amount.toFixed(2)})`)
          .join(", ")}`,
        action:
          "Focus on reducing expenses in these categories for maximum impact.",
      });

      // Additional category-specific advice
      topCategories.forEach(([category, amount]) => {
        if (amount > metrics.totalIncome * 0.3) {
          advice.push({
            type: "warning",
            message: `Your ${category} expenses are over 30% of your income.`,
            action: `Look for ways to reduce ${category.toLowerCase()} expenses or find better deals.`,
          });
        }
      });
    }

    // Unusual Transactions
    if (metrics.unusualTransactions.length > 0) {
      advice.push({
        type: "alert",
        message: `Found ${metrics.unusualTransactions.length} unusual transactions that are significantly higher than your normal spending.`,
        action:
          "Review these transactions to ensure they are legitimate and necessary.",
      });
    }

    // Monthly Budget Analysis
    const monthlyIncome = metrics.totalIncome;
    const monthlyExpenses = metrics.totalExpenses;
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    if (monthlyBalance < 0) {
      advice.push({
        type: "alert",
        message:
          "Your expenses exceed your income. This is unsustainable long-term.",
        action:
          "Create a budget and identify non-essential expenses that can be reduced.",
      });
    } else if (monthlyBalance < monthlyIncome * 0.1) {
      advice.push({
        type: "warning",
        message: "Your monthly savings are less than 10% of your income.",
        action:
          "Try to increase your savings by reducing discretionary spending.",
      });
    }

    // Add pattern-based advice
    if (patterns.recurring) {
      advice.push({
        type: "insight",
        message:
          "You have several recurring expenses that might offer opportunities for savings.",
        action:
          "Review your subscriptions and recurring bills for potential cost-cutting.",
      });
    }

    // Add budget recommendations
    if (recommendations && recommendations.length > 0) {
      advice.push(
        ...recommendations.map((rec) => ({
          type: "recommendation",
          message: rec.suggestion,
          action: rec.action,
        }))
      );
    }

    return advice;
  }
}

module.exports = new AIFinancialAdvisor();
