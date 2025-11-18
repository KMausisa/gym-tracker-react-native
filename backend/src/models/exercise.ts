export interface Exercise {
  id: string;
  userId: string;
  dayId: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  time: number;
  weight: number;
  createdAt: string;
}

export interface ExerciseInput {
  name: string;
  description: string;
  sets: number;
  reps: number;
  time: number;
  weight: number;
}

export interface ExerciseUpdateInput {
  name: string;
  description: string;
  sets: number;
  reps: number;
  time: number;
  weight: number;
}
