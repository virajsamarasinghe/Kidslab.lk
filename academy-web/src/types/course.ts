export interface Course {
  _id: string;
  title: string;
  description: string;
  ageRange: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  schedule: string;
  price: number;
  instructor: string;
  maxStudents: number;
  enrolledCount: number;
  isActive: boolean;
}
