export interface Course {
  _id: string;
  title: string;
  description: string;
  ageRange: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  schedule: string;
  price: number;
  instructors: { _id: string; name: string }[];
  maxStudents: number;
  enrolledCount: number;
  isActive: boolean;
  badgeText: string;
  ctaLabel: string;
  seminarNote: string;
}
