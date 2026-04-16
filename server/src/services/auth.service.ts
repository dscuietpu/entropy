import bcrypt from "bcryptjs";
import { Types, isValidObjectId } from "mongoose";

import { USER_ROLES, User, UserRole } from "../models";
import { HttpError } from "../utils/http-error";
import { generateAccessToken } from "../utils/jwt";

interface RegisterPayload {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: string;
  linkedHospitalId?: string;
}

interface LoginPayload {
  email?: string;
  password?: string;
}

export interface AuthSuccessResponse {
  token: string;
  user: SafeUser;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  linkedHospitalId?: string;
}

interface UserLike {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  linkedHospitalId?: Types.ObjectId;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user: UserLike): SafeUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  linkedHospitalId: user.linkedHospitalId?.toString(),
});

export const registerUser = async (payload: RegisterPayload): Promise<AuthSuccessResponse> => {
  const { name, email, password, phone, role, linkedHospitalId } = payload;

  if (!name || !email || !password || !phone || !role) {
    throw new HttpError(400, "name, email, password, phone and role are required");
  }

  if (!USER_ROLES.includes(role as UserRole)) {
    throw new HttpError(400, "Invalid role");
  }

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    throw new HttpError(400, "name cannot be empty");
  }

  if (!trimmedPhone) {
    throw new HttpError(400, "phone cannot be empty");
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new HttpError(400, "Invalid email format");
  }

  if (password.trim().length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters");
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    throw new HttpError(409, "User with this email already exists");
  }

  let parsedHospitalId: Types.ObjectId | undefined;
  if (linkedHospitalId) {
    if (!isValidObjectId(linkedHospitalId)) {
      throw new HttpError(400, "Invalid linkedHospitalId");
    }
    parsedHospitalId = new Types.ObjectId(linkedHospitalId);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    password: hashedPassword,
    phone: trimmedPhone,
    role: role as UserRole,
    linkedHospitalId: parsedHospitalId,
  });

  const token = generateAccessToken({
    userId: createdUser._id.toString(),
    role: createdUser.role,
    email: createdUser.email,
  });

  return {
    token,
    user: sanitizeUser(createdUser.toObject()),
  };
};

export const loginUser = async (payload: LoginPayload): Promise<AuthSuccessResponse> => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const inputPassword = password.trim();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new HttpError(400, "Invalid email format");
  }

  if (!inputPassword) {
    throw new HttpError(400, "password cannot be empty");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(inputPassword, user.password);
  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: sanitizeUser(user.toObject()),
  };
};

export const getCurrentUserById = async (userId: string): Promise<AuthSuccessResponse["user"]> => {
  if (!isValidObjectId(userId)) {
    throw new HttpError(400, "Invalid user id");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return sanitizeUser(user.toObject());
};
