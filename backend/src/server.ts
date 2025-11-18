import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { supabaseServiceClass } from "./services/supabaseService";
import { ClerkExpressRequireAuth, Clerk } from "@clerk/clerk-sdk-node";
import {
  clerkMiddleware,
  requireAuth,
  type ExpressRequestWithAuth,
} from "@clerk/express";
import e from "express";

// Environment Variables
const PORT = ENV.PORT;
console.log(
  "Using Clerk Secret Key:",
  ENV.CLERK_SECRET_KEY ? "Loaded" : "Not Loaded"
);
console.log(
  "Using Clerk Publishable Key:",
  ENV.CLERK_PUBLISHABLE_KEY ? "Loaded" : "Not Loaded"
);

// Initialize app
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Clerk middleware
app.use(clerkMiddleware());

// Testing route
app.get("/test", (req: Request, res: Response) => {
  res.json({ message: "Server is running!" });
});

// Testing protected route
app.get("/protected", requireAuth(), async (req: Request, res: Response) => {
  const { auth } = req as ExpressRequestWithAuth;
  console.log("Authenticated user:", auth().userId);
  res.json({ message: "Success", user: auth() });
});

// Test sending info to Supabase
app.post("/add-user", async (req: Request, res: Response) => {
  const { name } = req.body;
  const supabaseService = new supabaseServiceClass();
  try {
    const response = await supabaseService.testAdding(name);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// /* Different routes to implement:
// (POST) /create-user: The route that will handle new user creation. (DONE)
// (GET) /dashboard: The landing page after the user logins in. (DONE)
// (POST) /dashboard/save-workout/:workout_plan_id: The route that will handle saving the user's workout progress for a specific workout plan. (DONE)
// (GET) /progress: The page that shows the overview of the user's progress in the gym. (DONE)
// (GET) /progress/:exercise_progress_id: The page that will display progress for a specific exercise. (DONE)
// (GET) /workouts: The page that will show all the user's created workout plan. (DONE)
// (POST) /workouts/add-new: The page that will handle user's workout plan creation. (DONE)
// (PUT) /workouts/edit/:workout_plan_id: The page that will handle an update for a user's specific workout plan. (DONE)
// (DELETE) /workouts/delete/:workout_plan_id: The route that will handle deletion for a user's workout plan. (DONE)
// (GET) /workouts/:workout_plan_id: The page that will display information of a specific workout plan of a user. (DONE)
// (GET) /workouts/:workout_plan_id/:day: The page that will display the list of exercises for a specific day of a user's workout plan. (DONE)
// (POST) /workouts/:workout_plan_id/:day/add-exercise: The page that will handle adding exercises to a specific day in a user's workout. (DONE)
// (PUT) /workouts/:workout_plan_id/:day/:exercise_id/edit-exercise: The page that will handle adding exercises to a specific day in a user's workout. (DONE)
// (DELETE) /workouts/:workout_plan_id/:day/:exercise_id/delete-exercise: The route that will handle deletion for an exercise of a user's workout plan. (DONE)
// (GET) /profile: The page that will display the user's information. (DONE)
// */

// /***** GET ROUTES *****/
app.get("/profile", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { auth } = req as ExpressRequestWithAuth;
    // Get data
    const userId = auth().userId;
    if (!userId) return res.status(400).json({ error: "Missing user ID." });

    // Initialize Supabase Service
    const userToken = req.headers.authorization?.replace("Bearer ", "");
    if (!userToken)
      return res.status(401).json({ error: "Missing authorization token." });
    const supabaseService = new supabaseServiceClass(userToken);

    // Retrieve user profile, pass in required data
    const response = await supabaseService.getUser(userId);

    if (!response.user) {
      return res.status(400).json({ error: response.message });
    }
    return res.status(200).json({
      message: response.message,
      profile: response.user,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.get("/dashboard", requireAuth(), async (req: Request, res: Response) => {
  try {
    const workoutPlanId = req.query.workoutPlanId as string;
    if (!workoutPlanId) {
      return res
        .status(400)
        .json({ message: "No workout id provided, skipping..." });
    }
    const userToken = req.headers.authorization?.replace("Bearer ", "");
    if (!userToken)
      return res.status(401).json({ error: "Missing authorization token." });
    const supabaseService = new supabaseServiceClass(userToken);

    const response = await supabaseService.getWorkoutPlanById(workoutPlanId);
    if (!response.workoutPlan) {
      return res.status(400).json({ error: response.message });
    }
    return res.status(200).json({
      message: response.message,
      workoutPlan: response.workoutPlan,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.get("/workouts", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { auth } = req as ExpressRequestWithAuth;
    const userId = auth().userId;
    if (!userId) return res.status(400).json({ error: "Missing user ID." });

    const userToken = req.headers.authorization?.replace("Bearer ", "");
    if (!userToken)
      return res.status(401).json({ error: "Missing authorization token." });
    const supabaseService = new supabaseServiceClass(userToken);

    const response = await supabaseService.getUserWorkoutPlans(userId);
    if (!response.workoutPlans) {
      return res.status(400).json({ error: response.message });
    }
    return res.status(200).json({
      message: response.message,
      workoutPlans: response.workoutPlans,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.get(
  "/workouts/:workoutPlanId",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      // Get data
      const { workoutPlanId } = req.params;
      if (!workoutPlanId)
        return res.status(400).json({ error: "Missing workout ID." });

      // Initialize Supabase Service
      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });
      const supabaseService = new supabaseServiceClass(userToken);

      // Retrieve data, pass in requirements
      const response = await supabaseService.getWorkoutPlanById(workoutPlanId);
      if (!response.workoutPlan) {
        return res.status(400).json({ error: response.message });
      }
      return res.status(200).json({
        message: response.message,
        workoutPlan: response.workoutPlan,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

app.get(
  "/workouts/:workoutPlanId/:day",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      // Get data
      const { workoutPlanId, day } = req.params;
      if (!workoutPlanId)
        return res.status(400).json({ error: "Missing workout ID." });
      if (!day) return res.status(400).json({ error: "Missing day." });

      // Initialize Supabase Service
      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });
      const supabaseService = new supabaseServiceClass(userToken);

      // Retrieve exercise data, pass in required values
      const { dayId, message: dayMessage } = await supabaseService.getDayId(
        workoutPlanId,
        day
      );

      if (!dayId) return res.status(404).json({ error: dayMessage });

      const { exercises, message: exerciseMessage } =
        await supabaseService.getExercisesByDay(dayId);

      if (!exercises)
        return res.status(404).json({
          error: exerciseMessage,
        });

      return res.status(200).json({
        message: exerciseMessage,
        exercises: exercises,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

app.get("/progress", requireAuth(), async (req: Request, res: Response) => {
  try {
    // Get data
    const { auth } = req as ExpressRequestWithAuth;
    const userId = auth().userId;
    if (!userId) return res.status(400).json({ error: "Missing user ID." });

    // Initialize Supabase Service
    const userToken = req.headers.authorization?.replace("Bearer ", "");
    if (!userToken)
      return res.status(401).json({ error: "Missing authorization token." });

    const supabaseService = new supabaseServiceClass(userToken);

    // Retrieve user progress data, pass in values
    const response = await supabaseService.getExercisesProgress(userId);
    if (!response.exercisesProgress) {
      return res.status(400).json({ error: response.message });
    }
    return res.status(200).json({
      message: response.message,
      progress: response.exercisesProgress,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.get(
  "/progress/:exerciseProgressId",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      // Get data
      const { exerciseProgressId } = req.params;
      const { auth } = req as ExpressRequestWithAuth;
      const userId = auth().userId;

      if (!exerciseProgressId)
        return res.status(400).json({ error: "Missing exercise progress ID." });
      if (!userId) return res.status(400).json({ error: "Missing user ID." });

      // Initialize Supabase Service
      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });

      const supabaseService = new supabaseServiceClass(userToken);

      // Retrieve express progress, pass in required values
      const response = await supabaseService.getExerciseProgress(
        userId,
        exerciseProgressId
      );

      if (!response.exerciseProgress) {
        return res.status(400).json({ error: response.message });
      }
      return res.status(200).json({
        message: response.message,
        progress: response.exerciseProgress,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// /***** POST ROUTES *****/

// Add user to database
app.post("/create-user", async (req: Request, res: Response) => {
  const { id, email, firstName, lastName } = req.body;

  console.log("Received user data:", { id, email, firstName, lastName });

  const supabaseService = new supabaseServiceClass();

  try {
    const response = await supabaseService.addUser({
      id,
      email,
      firstName,
      lastName,
    });

    if (!response.user) {
      return res.status(404).json({ error: response.message });
    }
    return res.status(201).json({
      message: response.message,
      user: response.user,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// // Add workout plan to database
app.post(
  "/workouts/add-new",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      const { title, description, days } = req.body;
      const { auth } = req as ExpressRequestWithAuth;
      const userId = auth().userId;

      if (!userId) return res.status(400).json({ error: "Missing user ID." });

      if (!title || !description || !Array.isArray(days)) {
        return res.status(400).json({ error: "Invalid request data" });
      }

      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });
      const supabaseService = new supabaseServiceClass(userToken);

      const response = await supabaseService.addWorkoutPlan({
        userId,
        title,
        description,
        days,
      });

      if (!response.workoutPlan) {
        return res.status(404).json({ error: response.message });
      }

      return res.status(201).json({
        message: response.message,
        workoutPlan: response.workoutPlan,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// // Add exercise to workout day
app.post(
  "/workouts/:workoutPlanId/:day/add-exercise",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      // Get data
      const { auth } = req as ExpressRequestWithAuth;
      const userId = auth().userId;
      if (!userId) return res.status(400).json({ error: "Missing user ID." });

      const { workoutPlanId, day } = req.params;
      const { name, description, sets, reps, time, weight } = req.body;

      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });

      // Initialize Supabase Service
      const supabaseService = new supabaseServiceClass(userToken);

      const { dayId, message: dayMessage } = await supabaseService.getDayId(
        workoutPlanId,
        day
      );

      if (!dayId)
        return res.status(404).json({ message: "Workout day not found" });

      const response = await supabaseService.addExerciseToWorkoutDay(
        userId,
        dayId,
        {
          name,
          description,
          sets,
          reps,
          time,
          weight,
        }
      );

      if (!response.exercise)
        return res.status(400).json({ error: response.message });

      return res.status(200).json({
        message: response.message,
        exercise: response.exercise,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

app.post(
  "/dashboard/save-workout/:exerciseId",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      // Get data
      const { auth } = req as ExpressRequestWithAuth;
      const userId = auth().userId;
      if (!userId) return res.status(400).json({ error: "Missing user ID." });

      const { exerciseId } = req.params;
      const { name, sets, reps, times, weights, notes } = req.body;
      const progress = { name, sets, reps, times, weights, notes };

      // Initialize Supabase Service
      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });

      // Initialize Supabase Service
      const supabaseService = new supabaseServiceClass(userToken);

      const response = await supabaseService.saveWorkoutProgress(
        exerciseId,
        userId,
        progress
      );

      if (!response.exerciseProgress) {
        return res.status(404).json({ error: response.message });
      }
      return res.status(200).json({
        message: response.message,
        progress: response.exerciseProgress,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// /***** PUT ROUTES *****/
app.put(
  "/workouts/edit/:workoutPlanId",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      console.log("Received request to edit workout plan.");
      // Get data needed
      const { auth } = req as ExpressRequestWithAuth;
      const userId = auth().userId;
      if (!userId) return res.status(400).json({ error: "Missing user ID." });

      const { workoutPlanId } = req.params;
      if (!workoutPlanId)
        return res.status(400).json({ error: "Missing workout ID." });
      const { title, description, days } = req.body;

      // Initialize Supabase Service
      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });
      const supabaseService = new supabaseServiceClass(userToken);

      // Update workout plan, pass in data
      const response = await supabaseService.updateWorkoutPlan(
        workoutPlanId,
        userId,
        {
          title,
          description,
          days,
        }
      );
      if (!response.updatedWorkoutPlan) {
        return res.status(404).json({ error: response.message });
      }
      return res.status(200).json({
        message: response.message,
        updatedWorkoutPlan: response.updatedWorkoutPlan,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

app.put(
  "/workouts/:workoutPlanId/:day/:exerciseId/edit-exercise",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      // Get data
      const { auth } = req as ExpressRequestWithAuth;
      const userId = auth().userId;
      if (!userId) return res.status(400).json({ error: "Missing user ID." });

      const { exerciseId } = req.params;
      const { name, description, sets, reps, time, weight } = req.body;

      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });

      // Initialize Supabase Service
      const supabaseService = new supabaseServiceClass(userToken);

      const { updatedExercise, message: exerciseMessage } =
        await supabaseService.updateExerciseById(exerciseId, userId, {
          name,
          description,
          sets,
          reps,
          time,
          weight,
        });

      if (!updatedExercise) {
        return res.status(404).json({
          message: exerciseMessage,
        });
      }

      return res.status(200).json({
        message: "Exercise succesfully updated!",
        exercises: updatedExercise,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// /***** DELETE ROUTES *****/
app.delete(
  "/workouts/delete/:workoutPlanId",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      const { auth } = req as ExpressRequestWithAuth;
      const userId = auth().userId;
      if (!userId) return res.status(400).json({ error: "Missing user ID." });
      // Get data needed
      const { workoutPlanId } = req.params;
      if (!workoutPlanId)
        return res.status(400).json({ error: "Missing workout ID." });

      // Initialize Supabase Service
      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });
      const supabaseService = new supabaseServiceClass(userToken);

      // Delete workout plan, pass in data
      const response = await supabaseService.deleteWorkoutPlan(
        workoutPlanId,
        userId
      );

      if (!response.deletedWorkoutPlan)
        return res.status(404).json({ error: response.message });
      return res.status(200).json({
        message: response.message,
        deletedWorkoutPlan: response.deletedWorkoutPlan,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

app.delete(
  "/workouts/:workoutPlanId/:day/:exerciseId/delete-exercise",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      // Get data needed
      const { auth } = req as ExpressRequestWithAuth;
      const userId = auth().userId;
      if (!userId) return res.status(400).json({ error: "Missing user ID." });

      const { exerciseId } = req.params;
      console.log("Deleting exercise with ID:", exerciseId);

      const userToken = req.headers.authorization?.replace("Bearer ", "");
      if (!userToken)
        return res.status(401).json({ error: "Missing authorization token." });
      const supabaseService = new supabaseServiceClass(userToken);

      const response = await supabaseService.deleteExercise(exerciseId, userId);

      if (!response.deletedExercise)
        return res.status(404).json({ error: response.message });

      return res.status(200).json(response.message);
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Listen on port
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
