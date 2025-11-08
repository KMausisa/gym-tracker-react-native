import { supabaseAdmin, createSupaBaseClient } from "../config/db.js";

export class supabaseServiceClass {
  constructor(token = null) {
    this.supabaseClient = token ? createSupaBaseClient(token) : supabaseAdmin;
  }

  // Handle all CRUD operations here

  async testAdding(name) {
    const { error } = await this.supabaseClient
      .from("testing")
      .insert([{ name }]);

    if (error) {
      console.log(error);
      return { error: error.message };
    }

    return { message: "User added successfully!" };
  }

  /** Authentication */
  async addUser(user_id, email, first_name, last_name) {
    const user = {
      id: user_id,
      email,
      first_name,
      last_name,
    };
    const { error } = await this.supabaseClient.from("profiles").insert([user]);

    if (error) {
      console.log("Error adding user:", error);
      return { error: error.message };
    }
    return { message: "User added successfully!" };
  }

  // **** Workout Methods **** //

  /**
   * Adds a new workout plan to the database. Stored based on the user_id.
   * Takes the array of days and inserts them into the workout_days table.
   * @param user_id - Unique identifier of the user.
   * @param title - Title of the workout plan.
   * @param description - Description of the workout plan.
   * @param days - Array of days for the workout plan.
   * @returns
   */
  async addWorkoutPlan(user_id, title, description, days) {
    const plan = {
      user_id,
      title,
      description,
      days,
    };

    // Insert plan to workout_plans table
    const { data, error } = await this.supabaseClient
      .from("workout_plans")
      .insert([plan])
      .select()
      .single();

    if (error) {
      console.log("Error inserting workout plan:", error);
      return { error: error.message };
    }

    const daysToInsert = plan.days.map((day, index) => ({
      user_id: plan.user_id,
      workout_plan_id: data.id,
      day: day,
      position: index,
    }));

    console.log(daysToInsert);

    const { daysError } = await this.supabaseClient
      .from("workout_days")
      .insert(daysToInsert);

    if (daysError) {
      console.error("Error inserting workout days:", daysError);
      return { error: daysError.message };
    }

    return { message: "Workout plan added successfully!" };
  }

  /**
   * Save workout progress for a user after completing an exercise.
   * @param {*} userId - The unique identifier of the user.
   * @param {*} workoutId - The unique identifier of the workout.
   * @param {*} exerciseId - The unique identifier of the exercise.
   * @param {*} dayId - The unique identifier of the day.
   * @param {*} progress - An object containing progress details (name of exercise, sets done, reps done, weight used, notes).
   * @returns
   */
  async saveWorkoutProgress(userId, workoutId, exerciseId, dayId, progress) {
    // Insert progress into exercise_progress table
    const { error } = await this.supabaseClient
      .from("exercise_progress")
      .insert([
        {
          user_id: userId,
          workout_id: workoutId,
          exercise_id: exerciseId,
          day_id: dayId,
          ...progress,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("Error saving workout progress:", error);
      return { error: error.message };
    }

    return { message: "Workout progress saved successfully!" };
  }

  /**
   * Get the user's workout plans based on their id.
   * @param {*} userId - The unique identifier of the user.
   * @returns - Array of workout plans.
   */
  async getUserWorkouts(userId) {
    const { data, error } = await this.supabaseClient
      .from("workout_plans")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.log("Error fetching user workouts:", error);
      return { error: error.message };
    }
    return data;
  }

  /**
   * Get a workout plan by its id.
   * @param {*} workoutId - The unique identifier of the workout plan.
   * @returns - Workout plan object.
   */
  async getWorkoutById(workoutId) {
    const { data, error } = await this.supabaseClient
      .from("workout_plans")
      .select("*")
      .eq("id", workoutId)
      .single();

    if (error) {
      console.log("Error fetching workout by id:", error);
      return { error: error.message };
    }
    return data;
  }

  /***** Exercise Methods *****/

  /**
   * Get exercise details by its id.
   * @param {*} exerciseId - The unique identifier of the exercise.
   * @returns - Exercise object.
   */
  async getExerciseById(exerciseId) {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .select("*")
      .eq("id", exerciseId)
      .single();

    if (error) {
      console.log("Error fetching exercise by id:", error);
      return { error: error.message };
    }
    return data;
  }

  /**
   *
   * @param {*} exercise
   * @returns
   */
  async addExerciseToWorkoutDay(
    user_id,
    day_id,
    name,
    sets,
    reps,
    weight,
    notes
  ) {
    const exercise = {
      user_id,
      day_id,
      name,
      sets,
      reps,
      weight,
      notes,
    };
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .insert([exercise]);

    if (error) {
      console.log("Error adding exercise to workout day:", error);
      return { error: error.message };
    }
    return data;
  }

  /**
   * Get the day id for a given workout (id) and day of the week.
   * @param {*} workoutId - The unique identifier of the workout plan.
   * @param {*} day - The day of the week (e.g., "Monday", "Tuesday").
   * @returns - The unique identifier of the day.
   */
  async getDayId(workoutId, day) {
    const { data, error } = await this.supabaseClient
      .from("workout_days")
      .select("id")
      .eq("plan_id", workoutId)
      .eq("day_of_week", day)
      .single();

    if (error) {
      console.log("Error fetching day id:", error);
      return { error: error.message };
    }
    return data.id;
  }

  /**
   * Get routine (exercises) based on the day id.
   * @param {*} dayId
   * @returns - Array of exercises for the given day.
   */
  async getRoutineById(dayId) {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .select("*")
      .eq("day_id", dayId);

    if (error) {
      console.log("Error fetching routine by day id:", error);
      return { error: error.message };
    }
    return data;
  }

  /**
   * Get the user's progress of all exercises based on their user id.
   * @param {*} userId - The unique identifier of the user.
   * @returns - Array of exercise progress records.
   */
  async getWorkoutProgress(userId) {
    const { data, error } = await this.supabaseClient
      .from("exercise_progress")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching workout progress:", error);
      return { error: error.message };
    }
    return data;
  }

  /**
   * Update an existing workout plan.
   * @param {*} user_id - The unique identifier of the user.
   * @param {*} id - The unique identifier of the workout plan.
   * @param {*} title - The title of the workout plan.
   * @param {*} description - The description of the workout plan.
   * @param {*} days - Array of days for the workout plan.
   * @returns
   */
  async updatePlan(user_id, id, title, description, days) {
    const routine = {
      user_id,
      id,
      title,
      description,
      days,
    };
    const { data, error } = await this.supabaseClient
      .from("workout_plans")
      .update({
        title: routine.title,
        description: routine.description,
        days: routine.days,
      })
      .eq("id", routine.id)
      .select()
      .single();

    if (error) {
      console.log("Error updating workout plan:", error);
      return { error: error.message };
    }

    if (!data) {
      return {
        error: new Error("Workout plan update succeeded but returned no data."),
      };
    }

    const { data: existingDays, error: fetchDaysError } =
      await this.supabaseClient
        .from("workout_days")
        .select("id, day_of_week")
        .eq("plan_id", routine.id);

    if (fetchDaysError) {
      console.error("Error fetching existing workout days:", fetchDaysError);
      return { error: fetchDaysError.message };
    }

    const existingDayNames = (existingDays ?? []).map((d) => d.day_of_week);

    // Update the days in the workout_days table
    const daysToUpdate = routine.days
      .filter((day) => !existingDayNames.includes(day))
      .map((day, index) => ({
        plan_id: routine.id,
        user_id: routine.user_id,
        day_of_week: day,
        position: index,
      }));

    if (daysToUpdate.length > 0) {
      const { error: daysError } = await this.supabaseClient
        .from("workout_days")
        .upsert(daysToUpdate);

      if (daysError) {
        console.error("Error updating workout days:", daysError);
        return { error: daysError.message };
      }
    }

    // --- DELETE REMOVED DAYS ---

    const daysToDelete = (existingDays ?? []).filter(
      (d) => !routine.days.includes(d.day_of_week)
    );

    if (daysToDelete.length > 0) {
      const idsToDelete = daysToDelete.map((d) => d.id);
      const { error: deleteError } = await this.supabaseClient
        .from("workout_days")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        console.error("Error deleting removed workout days:", deleteError);
        return { error: deleteError.message };
      }
    }

    return data;
  }

  /**
   * Update the exercise plan by its id.
   * @param {*} dayId - The unique identifier of the day.
   * @param {*} userId - The unique identifier of the user.
   * @param {*} exerciseId - The unique identifier of the exercise.
   * @param {*} name - The name of the exercise.
   * @param {*} sets - The number of sets.
   * @param {*} reps - The number of reps.
   * @param {*} weight - The weight used.
   * @param {*} notes - Additional notes.
   * @returns
   */
  async updateExercisePlanById(
    dayId,
    userId,
    exerciseId,
    name,
    sets,
    reps,
    weight,
    notes
  ) {
    const { data, error } = await this.supabaseClient
      .from("exercises")
      .update({
        name: name,
        sets: sets,
        reps: reps,
        weight: weight,
        notes: notes,
      })
      .eq("id", exerciseId)
      .eq("day_id", dayId)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.log("Error updating exercise:", error);
      return { error: error.message };
    }
    if (!data) {
      return {
        error: new Error("Exercise update succeeded but returned no data."),
      };
    }
    return data;
  }

  /**
   * Delete a workout plan by its id.
   * @param {*} workoutId - The unique identifier of the workout plan.
   * @returns - Success or error message.
   */
  async deleteWorkout(workoutId) {
    const { error } = await this.supabaseClient
      .from("workout_plans")
      .delete()
      .eq("id", workoutId);

    if (error) {
      console.log("Error deleting workout plan:", error);
      return { error: error.message };
    }

    return { message: "Workout plan deleted successfully!" };
  }

  /**
   * Delete an exercise by its id.
   * @param {*} exerciseId - The unique identifier of the exercise.
   * @returns - Success or error message.
   */
  async deleteExercise(exerciseId) {
    const { error } = await this.supabase
      .from("exercises")
      .delete()
      .eq("id", exerciseId);

    if (error) {
      console.log("Error deleting exercise:", error);
      return { error: error.message };
    }
    return { message: "Exercise deleted successfully!" };
  }
}

export const supabaseService = new supabaseServiceClass();
