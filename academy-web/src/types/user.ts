export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  parentName: string;
  city: string;
  interestedCourse: string;
  status: "active" | "inactive";
  createdAt: string;
}
