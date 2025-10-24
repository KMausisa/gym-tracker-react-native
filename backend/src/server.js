import express from "express";
import { ENV } from "./config/env.js";
import { supabaseService } from "./services/supabaseService.js";

// Environment Variables
const PORT = ENV.PORT;

// Initialize app
const app = express();

app.use(express.json());

// Testing route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Test sending info to Supabase
app.post("/add-user", async (req, res) => {
  const { name } = req.body;
  try {
    const response = await supabaseService.testAdding(name);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Listen on port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
