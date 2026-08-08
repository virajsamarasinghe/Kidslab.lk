import mongoose, { Schema, Document } from "mongoose";

export interface IInstructor extends Document {
  name: string;
  title: string;
  bio: string;
  photo: string;
  email: string;
  createdAt: Date;
}

const InstructorSchema = new Schema<IInstructor>(
  {
    name:  { type: String, required: true, trim: true },
    title: { type: String, default: "" },
    bio:   { type: String, default: "" },
    photo: { type: String, default: "" },
    email: { type: String, default: "", trim: true, lowercase: true },
  },
  { timestamps: true }
);

export default mongoose.models.Instructor as mongoose.Model<IInstructor> ||
  mongoose.model<IInstructor>("Instructor", InstructorSchema);
