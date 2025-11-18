export interface WorkoutPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  days: string[];
  createdAt: string;
  //   updatedAt: string;
}

export interface WorkoutPlanInput {
  userId: string;
  title: string;
  description?: string;
  days: string[];
}
