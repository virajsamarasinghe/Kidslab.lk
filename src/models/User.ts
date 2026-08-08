import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  clerkId?: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  phone: string;
  age: number;
  parentName: string;
  city: string;
  interestedCourse: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  enrolledCourses: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    // Set only for accounts created via Clerk sign-up; absent for seminar leads.
    clerkId:          { type: String, unique: true, sparse: true },
    name:             { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Clerk owns the credential for clerkId accounts, so this stays empty for them.
    password:         { type: String, default: "" },
    avatar:           { type: String, default: "" },
    phone:            { type: String, default: "" },
    age:              { type: Number, default: 0 },
    parentName:       { type: String, default: "" },
    city:             { type: String, default: "" },
    interestedCourse: { type: String, default: "" },
    role:             { type: String, enum: ["user", "admin"], default: "user" },
    status:           { type: String, enum: ["active", "inactive"], default: "active" },
    enrolledCourses:  [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

export default mongoose.models.User as mongoose.Model<IUser> ||
  mongoose.model<IUser>("User", UserSchema);
