import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description: string;
  ageRange: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  schedule: string;
  price: number;
  instructors: mongoose.Types.ObjectId[];
  maxStudents: number;
  enrolledCount: number;
  isActive: boolean;
  // Optional overrides for the landing-page program card — fall back to
  // translated defaults on the frontend when left blank.
  badgeText: string;
  ctaLabel: string;
  seminarNote: string;
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
    instructors:    [{ type: Schema.Types.ObjectId, ref: "Instructor" }],
    maxStudents:    { type: Number, default: 50 },
    enrolledCount:  { type: Number, default: 0 },
    isActive:       { type: Boolean, default: true },
    badgeText:      { type: String, default: "" },
    ctaLabel:       { type: String, default: "" },
    seminarNote:    { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Course as mongoose.Model<ICourse> ||
  mongoose.model<ICourse>("Course", CourseSchema);
