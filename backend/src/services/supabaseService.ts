import { supabaseAdmin, createSupaBaseClient } from "../config/db";

// Import models
import { WorkoutPlan } from "../models/workoutPlan";
import { Exercise } from "../models/exercise";
import { ExerciseProgress } from "../models/exerciseProgress";
import { User, ClerkUser } from "../models/user";

export class supabaseServiceClass {
  supabaseClient;
  constructor(token: string | null = null) {
    this.supabaseClient = token ? createSupaBaseClient(token) : supabaseAdmin;
  }

  // Handle all CRUD operations here

  async testAdding(name: string) {
    const { error } = await this.supabaseClient
      .from("testing")
      .insert([{ name }]);

    if (error) {
      console.error(error);
      return { error: error.message };
    }

    return { message: "User added successfully!" };
  }

  /** Authentication */

  /**
   * Add user to database.
   * @param {ClerkUser} user The user's information provided by Clerk.
   * @returns {Promise<{ user: User | null; message: string }>} An object containing the user's inserted data and message.
   * @throws {Error} Returns an error if user insertion was unsuccessful.
   */
  async addUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: User | null; message: string }> {
    const { data: userData, error } = await this.supabaseClient
      .from("profiles")
      .insert([
        {
          id: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding user:", error);
      throw new Error(error.message);
    }

    if (!userData) {
      console.warn("No user data returned after insertion.");
      return { user: null, message: "No user data returned." };
    }
    return { user: userData, message: "User added successfully!" };
  }

  /**
   * Retrieves the user's profile.
   * @param {string} userId The user's id.
   * @returns {Promise<{ user: User | null; message: string }> } An object containing user's information and message.
   * @throws {Error} Returns an error if the user's data was not retrieved.
   */
  async getUser(
    userId: string
  ): Promise<{ user: User | null; message: string }> {
    const { data, error } = await this.supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error retrieving user profile data:", error);
      throw new Error(error.message);
    }

    if (!data) {
      console.warn("User data was not retrieved. ");
      return { user: null, message: "No data was retrieved." };
    }

    return { user: data, message: "Successfully retrieved user profile!" };
  }

  // **** Workout Methods **** //

  /**
   * Adds a new workout plan to the database. Stored based on the user_id.
   * Takes the array of days and inserts them into the workout_days table.
   * @param {WorkoutPlanInput} plan The user's submitted plan.
   * @returns {Promise<{ workoutPlan: WorkoutPlan | null; message: string }>} An object containing the user's workout plan data and message.
   * @throws {Error} If the data insertion was unsuccessful.
   */
  async addWorkoutPlan(plan: {
    userId: string;
    title: string;
    description: string;
    days: string[];
  }): Promise<{ workoutPlan: WorkoutPlan | null; message: string }> {
    // Insert plan to workout_plans table
    const { data: workoutPlan, error } = await this.supabaseClient
      .from("workout_plans")
      .insert([
        {
          user_id: plan.userId,
          title: plan.title,
          description: plan.description,
          days: plan.days,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting workout plan:", error);
      throw new Error(error.message);
    }

    if (!workoutPlan) {
      console.warn("Workout plan was returned after insertion.");
      return { workoutPlan: null, message: "Workout plan was not retrieved." };
    }

    const daysToInsert = plan.days.map((day, index) => ({
      user_id: plan.userId,
      workout_plan_id: workoutPlan.id,
      day: day,
      position: index,
    }));

    const { error: daysError } = await this.supabaseClient
      .from("workout_days")
      .insert(daysToInsert);

    if (daysError) {
      console.error("Error inserting workout days:", daysError);
      throw new Error(daysError.message);
    }

    return {
      workoutPlan: workoutPlan,
      message: "Workout plan added successfully!",
    };
  }

  /**
   * Save workout progress for a user after completing an exercise.
   * @param {ExerciseProgressInput} progress - The unique identifier of the user.
   * @returns {Promise<{ exerciseProgress: ExerciseProgress | null; message: string }>} An object with the returned inserted data and message.
   * @throws {Error} If insertion or return of insertion was unsuccessful.
   */
  async saveWorkoutProgress(
    exerciseId: string,
    userId: string,
    progress: {
      name: string;
      sets: number;
      reps: number[];
      times: number[];
      weights: number[];
      notes: string;
    }
  ): Promise<{ exerciseProgress: ExerciseProgress | null; message: string }> {
    // Insert progress into exercise_progress table
    const { data, error } = await this.supabaseClient
      .from("exercise_progress")
      .insert([
        {
          exercise_id: exerciseId,
          user_id: userId,
          ...progress,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error saving workout progress:", error);
      throw new Error(error.message);
    }

    if (!data) {
      console.warn("Data was not inserted.");
      return { exerciseProgress: null, message: "Data was not inserted." };
    }

    return {
      exerciseProgress: data,
      message: "Workout progress saved successfully!",
    };
  }

  /**
   * Get the user's workout plans based on their id.
   * @param {string} userId The unique identifier of the user.
   * @returns {Promise<{workoutPlans: WorkoutPlan[] | null; message: string }>} An object containing array of workout plans (or null if not found) and a message.
   * @throws {Error} If retrieval was unsuccessful.
   */
  async getUserWorkoutPlans(userId: string): Promise<{
    workoutPlans: WorkoutPlan[] | null;
    message: string;
  }> {
    const { data, error } = await this.supabaseClient
      .from("workout_plans")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user workouts:", error);
      throw new Error(error.message);
    }

    if (!data || data.length == 0) {
      console.warn("No data was returned/found.");
      return { workoutPlans: null, message: "No data was returned/found." };
    }

    return {
      workoutPlans: data,
      message: "Successfully found user's workout plans!",
    };
  }

  /**
   * Get a workout plan by its id.
   * @param {string} workoutId The unique identifier of the workout plan.
   * @returns {Promise<{ workoutPlan: WorkoutPlan | null; message: string; }>} An object containing the user workout plan (or null if not found) and a message.
   * @throws {Error} If the workout retrieval was unsuccessful.
   */
  async getWorkoutPlanById(workoutId: string): Promise<{
    workoutPlan: WorkoutPlan | null;
    message: string;
  }> {
    const { data, error } = await this.supabaseClient
      .from("workout_plans")
      .select("*")
      .eq("id", workoutId)
      .single();

    if (error) {
      console.error("Error fetching workout by id:", error);
      throw new Error(error.message);
    }

    if (!data) {
      console.warn("No data was retrieved/found.");
      return { workoutPlan: null, message: "No data was retrieved/found." };
    }
    return { workoutPlan: data, message: "Successfully found user workout!" };
  }

  /***** Exercise Methods *****/

  /**
   * Get exercise details by its id.
   * @param {string} exerciseId The unique identifier of the exercise.
   * @returns {Promise<{ exercise: Exercise | null; message: string }>} An object containing the user's exercise (or null if not found) and a message.
   * @throws {Error} If the exercise retrieval was unsuccessful.
   */
  async getExerciseById(
    exerciseId: string
  ): Promise<{ exercise: Exercise | null; message: string }> {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .select("*")
      .eq("id", exerciseId)
      .single();

    if (error) {
      console.error("Error fetching exercise by id:", error);
      throw new Error(error.message);
    }

    if (!data) {
      console.warn("No data was retrieved/found.");
      return { exercise: null, message: "No data was retrieved/found." };
    }
    return { exercise: data, message: "Successfully found user's exercise!" };
  }

  /**
   * Add an exercise to a specific day of a workout.
   * @param {string} userId The id of the user.
   * @param {string} dayId The id of the day.
   * @param {ExerciseInput} exercise The exercise data to be inserted.
   * @returns {{Promise<{ exercise: Exercise | null; message: string }> | null; message: string}} An object containing the inserted exercise (or null if not found) and a message.
   * @throws {Error} If the insertion was unsuccessful.
   */
  async addExerciseToWorkoutDay(
    userId: string,
    dayId: string,
    exercise: {
      name: string;
      description: string;
      sets: number;
      reps: number;
      time: number;
      weight: number;
    }
  ): Promise<{ exercise: Exercise | null; message: string }> {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .insert([
        {
          user_id: userId,
          day_id: dayId,
          ...exercise,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding exercise to workout day:", error);
      throw new Error(error.message);
    }

    if (!data) {
      console.warn("No exercise data returned after insertion.");
      return { exercise: null, message: "No exercise data returned." };
    }

    return {
      exercise: data,
      message: "Workout plan added successfully!",
    };
  }

  /**
   * Get the day id for a given workout (id) and day of the week.
   * @param {string} workoutPlanId The unique identifier of the workout plan.
   * @param {string} day The day of the week (e.g., "Monday", "Tuesday").
   * @returns {Promise<{ dayId: string | null; message: string | null;}>} An object containing the retrieved data (or null if not found) and a message.
   * @throws {Error} If retrieval was unsuccessful.
   */
  async getDayId(
    workoutPlanId: string,
    day: string
  ): Promise<{
    dayId: string | null;
    message: string | null;
  }> {
    const { data, error } = await this.supabaseClient
      .from("workout_days")
      .select("id")
      .eq("workout_plan_id", workoutPlanId)
      .eq("day", day)
      .single();

    if (error) {
      console.error("Error fetching day id:", error);
      throw new Error(error.message);
    }

    if (!data) {
      console.warn("No data was retrieved/found.");
      return { dayId: null, message: "No data was retrieved/found." };
    }
    return { dayId: data.id, message: "Successfully retrieved day id!" };
  }

  /**
   * Get exercises based on the day id.
   * @param {string} dayId The unique identifier of the day.
   * @returns {Promise<{ exercises: Exercise[] | null; message: string | null;}>} An object with a list of exercises (or null if not found) and a message.
   * @throws {Error} If retrieval was unsuccessful.
   */
  async getExercisesByDay(dayId: string): Promise<{
    exercises: Exercise[] | null;
    message: string | null;
  }> {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .select("*")
      .eq("day_id", dayId);

    if (error) {
      console.log("Error fetching routine by day id:", error);
      throw new Error(error.message);
    }

    if (!data || data.length == 0) {
      console.warn("No exercises found for the given day.");
      return {
        exercises: null,
        message: "No exercises found for the given day.",
      };
    }

    return { exercises: data, message: "Exercise successfully retrieved!" };
  }

  /**
   * Get the user's progress of all exercises based on their user id.
   * @param {string} userId The unique identifier of the user.
   * @returns { Promise<{exercisesProgress: ExerciseProgress[] | null; message: string | null; }>} An object containing array of exercise progress records (or null if not found) and a message.
   * @throws {Error} If retrieval was unsuccessful.
   */
  async getExercisesProgress(userId: string): Promise<{
    exercisesProgress: ExerciseProgress[] | null;
    message: string | null;
  }> {
    const { data, error } = await this.supabaseClient
      .from("exercise_progress")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching workout progress:", error);
      throw new Error(error.message);
    }

    if (!data || data.length == 0) {
      console.warn("No exercises found for this user.");
      return {
        exercisesProgress: null,
        message: "No exercises found for this user.",
      };
    }
    return {
      exercisesProgress: data,
      message: "Successfully retrieved user's exercise progress.",
    };
  }

  /**
   * Get the user's progress of a specific exercise based on their user id and exercise id.
   * @param {string} userId The unique identifier of the user.
   * @param {string} exerciseId The unique identifier of the exercise.
   * @returns {Promise<{ exerciseProgress: ExerciseProgress | null; message: string | null; }>} An object containing progress for a specific progress (or null if not found) and a message.
   * @throws {Error} If retrieval was unsuccessful.
   */
  async getExerciseProgress(
    userId: string,
    exerciseId: string
  ): Promise<{
    exerciseProgress: ExerciseProgress | null;
    message: string | null;
  }> {
    const { data, error } = await this.supabaseClient
      .from("exercise_progress")
      .select("*")
      .eq("id", exerciseId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching workout progress:", error);
      throw new Error(error.message);
    }

    if (!data || data.length == 0) {
      console.warn("No rows found for the given exercise and user.");
      return { exerciseProgress: null, message: "No rows found." };
    }
    return {
      exerciseProgress: data,
      message: "Successfully found user's exercise progress!",
    };
  }

  /**
   * Update an existing workout plan.
   * @param {string} id The unique identifier of the workout plan.
   * @param {{ title: string; description: string; days: string[]; }} updatedWorkoutPlan An object with a workout plan's updated values.
   * @returns {Promise<{ updatedWorkoutPlan: WorkoutPlan | null; message: string }>} An object containing the updated workout plan (or null if not found) and a message.
   * @throws {Error} If the update was unsuccessful.
   */
  async updateWorkoutPlan(
    id: string,
    userId: string,
    workoutPlantoUpdate: {
      title: string;
      description: string;
      days: string[];
    }
  ): Promise<{ updatedWorkoutPlan: WorkoutPlan | null; message: string }> {
    const { data, error } = await this.supabaseClient
      .from("workout_plans")
      .update([workoutPlantoUpdate])
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating workout plan:", error);
      throw new Error(error.message);
    }

    if (!data) {
      console.warn("No data returned after workout plan update.");
      return {
        updatedWorkoutPlan: null,
        message: "No data returned after workout plan update.",
      };
    }

    const { data: existingDays, error: fetchDaysError } =
      await this.supabaseClient
        .from("workout_days")
        .select("id, day")
        .eq("workout_plan_id", id);

    if (fetchDaysError) {
      console.error("Error fetching existing workout days:", fetchDaysError);
      throw new Error(fetchDaysError.message);
    }

    const existingDayNames = (existingDays ?? []).map((d) => d.day);

    // Update the days in the workout_days table
    const daysToUpdate = workoutPlantoUpdate.days
      .filter((day) => !existingDayNames.includes(day))
      .map((day, index) => ({
        workout_plan_id: id,
        day: day,
        position: index,
      }));

    if (daysToUpdate.length > 0) {
      const { error: daysError } = await this.supabaseClient
        .from("workout_days")
        .upsert(daysToUpdate);

      if (daysError) {
        console.error("Error updating workout days:", daysError);
        throw new Error(daysError.message);
      }
    }

    // --- DELETE REMOVED DAYS ---

    const daysToDelete = (existingDays ?? []).filter(
      (d) => !workoutPlantoUpdate.days.includes(d.day)
    );

    if (daysToDelete.length > 0) {
      const idsToDelete = daysToDelete.map((d) => d.id);
      const { error: deleteError } = await this.supabaseClient
        .from("workout_days")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        console.error("Error deleting removed workout days:", deleteError);
        throw new Error(deleteError.message);
      }
    }

    return {
      updatedWorkoutPlan: data,
      message: "Workout plan updated successfully!",
    };
  }

  /**
   * Update the exercise plan by its id.
   * @param {string} id The unique identifier of the exercise.
   * @param {string} userId The unique identifier of the user.
   * @param {ExerciseUpdateInput} exerciseToUpdate The data to be updated.
   * @returns {Promise<{ updatedExercise: Exercise | null; message: string }>} An object containing the updated exercise (or null if not found) and a message.
   * @throws {Error} If the update was unsuccessful.
   */
  async updateExerciseById(
    id: string,
    userId: string,
    exerciseToUpdate: {
      name: string;
      description: string;
      sets: number;
      reps: number;
      time: number;
      weight: number;
    }
  ): Promise<{ updatedExercise: Exercise | null; message: string }> {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .update([exerciseToUpdate])
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating exercise:", error);
      throw new Error(error.message);
    }
    if (!data) {
      console.warn("No data returned after exercise update.");
      return {
        updatedExercise: null,
        message: "No data returned after exercise update.",
      };
    }
    return {
      updatedExercise: data,
      message: "Successfully updated user's exercise! ",
    };
  }

  /**
   * Delete a workout plan by its id.
   * @param {string} workoutId The unique identifier of the workout plan.
   * @returns {Promise<{ message: string }>} Success or error message.
   * @throws {Error} If deletion was unsuccessful.
   */
  async deleteWorkoutPlan(
    workoutId: string,
    userId: string
  ): Promise<{ deletedWorkoutPlan: WorkoutPlan | null; message: string }> {
    const { data, error } = await this.supabaseClient
      .from("workout_plans")
      .delete()
      .eq("id", workoutId)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Error deleting workout plan:", error);
      throw new Error(error.message);
    }

    if (!data || data.length == 0) {
      return {
        deletedWorkoutPlan: null,
        message: "No workout plan found with that ID.",
      };
    }

    return {
      deletedWorkoutPlan: data[0],
      message: "Workout plan deleted successfully!",
    };
  }

  /**
   * Delete an exercise by its id.
   * @param {string} exerciseId The unique identifier of the exercise.
   * @returns {Promise<{ deletedExercise: Exercise | null; message: string }>} Success or error message.
   * @throws {Error} If deletion was unsuccessful.
   */
  async deleteExercise(
    exerciseId: string,
    userId: string
  ): Promise<{ deletedExercise: Exercise | null; message: string }> {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .delete()
      .eq("id", exerciseId)
      .select();

    if (error) {
      console.error("Error deleting exercise:", error);
      throw new Error(error.message);
    }

    if (!data || data.length == 0) {
      return {
        deletedExercise: null,
        message: "No exercise found with that ID.",
      };
    }
    return {
      deletedExercise: data[0],
      message: "Exercise deleted successfully!",
    };
  }
}

export const supabaseService = new supabaseServiceClass();
