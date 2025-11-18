export interface ExerciseProgress {
  id: string;
  exerciseId: string;
  userId: string;
  name: string;
  sets: number;
  reps: number[];
  times: number[];
  weights: number[];
  notes: string;
  createdAt: string;
}

export interface ExerciseProgressInput {
  exerciseId: string;
  userId: string;
  name: string;
  sets: number;
  reps: number[];
  times: number[];
  weights: number[];
  notes: string;
}
