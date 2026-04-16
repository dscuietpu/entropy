import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export const USER_ROLES = ["patient", "hospital_admin", "doctor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  linkedHospitalId?: Types.ObjectId;
}

type UserModel = Model<IUser>;
export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: USER_ROLES, required: true },
    linkedHospitalId: { type: Schema.Types.ObjectId, ref: "Hospital" },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, linkedHospitalId: 1 });

export const User = model<IUser, UserModel>("User", userSchema);
