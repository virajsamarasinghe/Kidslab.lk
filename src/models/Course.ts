import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
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
  createdAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title:          { type: String, required: true, trim: true },
    description:    { type: String, default: "" },
    ageRange:       { type: String, default: "8–18" },
    level:          { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    duration:       { type: String, default: "" },
    schedule:       { type: String, default: "" },
    price:          { type: Number, default: 0 },
    instructor:     { type: String, default: "" },
    maxStudents:    { type: Number, default: 50 },
    enrolledCount:  { type: Number, default: 0 },
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Course as mongoose.Model<ICourse> ||
  mongoose.model<ICourse>("Course", CourseSchema);
