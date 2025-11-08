import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import { supabaseServiceClass } from "./services/supabaseService.js";
import { ClerkExpressRequireAuth, Clerk } from "@clerk/clerk-sdk-node";

// Environment Variables
const PORT = ENV.PORT;
console.log(
  "Using Clerk Secret Key:",
  ENV.CLERK_SECRET_KEY ? "Loaded" : "Not Loaded"
);
const clerk = Clerk({ secretKey: ENV.CLERK_SECRET_KEY });

// Initialize app
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Testing route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.get("/debug-token", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    // This returns the session payload
    const session = await clerk.verifyToken(token);
    // Or, if using v5+ recommended method:
    // const session = await clerk.verifyToken(token);

    res.json({ userId: session.userId, sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Testing protected route
app.get("/protected", ClerkExpressRequireAuth({ clerk }), async (req, res) => {
  console.log("Authenticated user:", req.auth);
  res.json({ message: "Success", user: req.auth });
});

// Test sending info to Supabase
app.post("/add-user", async (req, res) => {
  const { name } = req.body;
  const supabaseService = new supabaseServiceClass();
  try {
    const response = await supabaseService.testAdding(name);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add user to database
app.post("/create-user", async (req, res) => {
  const { createdUserId, email, firstName, lastName } = req.body;

  console.log("Received data:", { createdUserId, email, firstName, lastName });
  const supabaseService = new supabaseServiceClass();

  try {
    const response = await supabaseService.addUser(
      createdUserId,
      email,
      firstName,
      lastName
    );
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add workout plan to database
app.post("/add-workout-plan", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { title, description, days } = req.body;
    const user_id = req.auth.userId;

    // console.log("Received data:", { user_id, title, description, days });

    if (!title || !description || !Array.isArray(days)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const userToken = req.headers.authorization?.replace("Bearer ", "");
    const supabaseService = new supabaseServiceClass(userToken);

    // const session = await clerk.verifyToken(userToken);
    // console.log(session?.sub);

    const response = await supabaseService.addWorkoutPlan(
      user_id,
      title,
      description,
      days
    );
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Listen on port
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
