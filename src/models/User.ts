import mongoose, { Schema, Document } from "mongoose";
import { ALL_ROLES, type Role } from "@/lib/roles";

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
  role: Role;
  status: "active" | "inactive";
  enrolledCourses: mongoose.Types.ObjectId[];
  /**
   * Per-admin "notifications read up to" checkpoints, keyed by badge.
   * Stored server-side so the state follows the account across browsers and
   * devices instead of living in one browser's localStorage.
   */
  notificationsSeen: Map<string, Date>;
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
    role:             { type: String, enum: ALL_ROLES, default: "user" },
    status:           { type: String, enum: ["active", "inactive"], default: "active" },
    enrolledCourses:  [{ type: Schema.Types.ObjectId, ref: "Course" }],
    notificationsSeen: { type: Map, of: Date, default: () => new Map() },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ role: 1, city: 1 });
UserSchema.index({ role: 1, status: 1 });

export default mongoose.models.User as mongoose.Model<IUser> ||
  mongoose.model<IUser>("User", UserSchema);
