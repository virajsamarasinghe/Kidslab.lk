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
  /** Consecutive failed admin logins; reset to 0 on success. */
  failedLoginAttempts: number;
  /** Set when the failure threshold is hit; logins are refused until it passes. */
  lockedUntil?: Date;
  /** Sessions issued before this instant are rejected — see `requireCapability`. */
  passwordChangedAt?: Date;
  /** Set on invite-created admin accounts; forces a password change before anything else. */
  mustChangePassword: boolean;
  /** Set by "sign out everywhere"; invalidates every existing session. */
  sessionsRevokedAt?: Date;
  /** Base32 TOTP secret. Present once enrolment starts, active only when `twoFactorEnabled`. */
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  /** bcrypt hashes of single-use recovery codes; each is deleted as it's spent. */
  twoFactorRecoveryCodes: string[];
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
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil:         { type: Date },
    passwordChangedAt:   { type: Date },
    mustChangePassword:  { type: Boolean, default: false },
    sessionsRevokedAt:   { type: Date },
    twoFactorSecret:        { type: String, select: false },
    twoFactorEnabled:       { type: Boolean, default: false },
    twoFactorRecoveryCodes: { type: [String], default: [], select: false },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ role: 1, city: 1 });
UserSchema.index({ role: 1, status: 1 });

export default mongoose.models.User as mongoose.Model<IUser> ||
  mongoose.model<IUser>("User", UserSchema);
