const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

// @desc    Get AI budget predictions
// @route   POST /api/aibudget/predictions
// @access  Private
const getAIBudgetPredictions = async (req, res) => {
  try {
    const { transactions, monthlySalary } = req.body;

    if (!transactions || !monthlySalary) {
      return res.status(400).json({
        success: false,
        error: "Please provide both transactions and monthly salary",
      });
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide at least one transaction",
      });
    }

    // Log the input data for debugging
    console.log("Processing predictions for:", {
      transactionCount: transactions.length,
      monthlySalary,
      sampleTransaction: transactions[0],
    });

    // Format the data for Python
    const inputData = {
      transactions: transactions.map((t) => ({
        date: t.date.toString(),
        amount: Number(t.amount),
        type: String(t.type),
        category: t.category || "",
      })),
      monthlySalary: Number(monthlySalary),
    };

    // Create a temporary file to pass data to Python with UTF-8 encoding
    const tempFilePath = path.join(
      os.tmpdir(),
      `budget_input_${Date.now()}.json`
    );
    fs.writeFileSync(tempFilePath, JSON.stringify(inputData), "utf8");
    console.log("Created temporary file:", tempFilePath);

    // Try different Python commands in order of preference
    const pythonCommands = [
      "python3",
      "python",
      "py -3",
      "C:\\Users\\HP\\AppData\\Local\\Microsoft\\WindowsApps\\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\\python.exe",
    ];

    let pythonProcess = null;
    let pythonError = null;

    // Try each Python command until one works
    for (const cmd of pythonCommands) {
      try {
        pythonProcess = spawn(
          cmd,
          [
            path.join(__dirname, "..", "models", "budget_model.py"),
            tempFilePath,
          ],
          {
            stdio: ["pipe", "pipe", "pipe"],
            env: {
              ...process.env,
              PYTHONIOENCODING: "utf-8",
              PYTHONUTF8: "1",
            },
          }
        );
        break; // If spawn succeeds, break the loop
      } catch (err) {
        pythonError = err;
        continue; // Try next command if this one fails
      }
    }

    if (!pythonProcess) {
      throw new Error(
        `Failed to start Python process: ${
          pythonError?.message || "No Python interpreter found"
        }`
      );
    }

    let stdoutData = "";
    let stderrData = "";

    // Collect data from script with explicit UTF-8 encoding
    pythonProcess.stdout.setEncoding("utf8");
    pythonProcess.stderr.setEncoding("utf8");

    pythonProcess.stdout.on("data", (data) => {
      console.log("Python stdout chunk:", data.toString("utf8")); // Debug log
      stdoutData += data;
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python stderr chunk:", data.toString("utf8")); // Debug log
      stderrData += data;
    });

    // Handle process completion
    return new Promise((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        // Clean up the temporary file
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`Deleted temporary file: ${tempFilePath}`);
        } catch (err) {
          console.error(`Failed to delete temporary file: ${err.message}`);
        }

        console.log("Python process exited with code:", code);
        console.log("Final stdout:", stdoutData);
        console.log("Final stderr:", stderrData);

        if (code !== 0) {
          console.error("Process exited with code:", code);
          console.error("Error output:", stderrData);
          return res.status(500).json({
            success: false,
            error: stderrData || "Failed to process budget predictions",
          });
        }

        try {
          // Use only stdout data for parsing JSON
          console.log("Attempting to parse JSON from stdout:", stdoutData);

          // Check if stdout is empty
          if (!stdoutData.trim()) {
            throw new Error("No output received from Python script");
          }

          // Clean the stdout data to ensure it's valid JSON
          const cleanJson = stdoutData.trim();

          // Check if the JSON is complete
          if (!cleanJson.startsWith("{") || !cleanJson.endsWith("}")) {
            console.error("Invalid JSON format:", cleanJson);
            throw new Error("Invalid JSON format received from Python script");
          }

          // Parse the cleaned JSON
          const predictions = JSON.parse(cleanJson);

          if (predictions.error) {
            return res.status(400).json({
              success: false,
              error: predictions.error,
            });
          }

          // Set proper content type with UTF-8 charset
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          return res.json({
            success: true,
            data: predictions,
          });
        } catch (err) {
          console.error("Failed to parse prediction results:", err);
          console.error("Raw stdout:", stdoutData);
          console.error("Raw stderr:", stderrData);
          return res.status(500).json({
            success: false,
            error: "Failed to parse prediction results",
            details: err.message,
          });
        }
      });

      pythonProcess.on("error", (err) => {
        // Clean up the temporary file
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`Deleted temporary file: ${tempFilePath}`);
        } catch (cleanupErr) {
          console.error(
            `Failed to delete temporary file: ${cleanupErr.message}`
          );
        }

        console.error("Failed to start Python process:", err);
        return res.status(500).json({
          success: false,
          error: "Failed to start prediction process: " + err.message,
        });
      });
    });
  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

module.exports = {
  getAIBudgetPredictions,
};
