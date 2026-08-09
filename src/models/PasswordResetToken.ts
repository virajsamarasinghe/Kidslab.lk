import mongoose, { Schema, Document } from "mongoose";

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  /** SHA-256 of the token — the plaintext only ever exists in the emailed link. */
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt:    { type: Date },
  },
  { timestamps: true }
);

// Mongo drops rows once they expire, so spent tokens don't accumulate.
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.PasswordResetToken as mongoose.Model<IPasswordResetToken> ||
  mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
