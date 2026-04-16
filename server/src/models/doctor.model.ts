import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export interface IDoctor {
  hospitalId: Types.ObjectId;
  name: string;
  specialization: string;
  department: string;
  experience: number;
  availability: boolean;
  averageRating: number;
}

type DoctorModel = Model<IDoctor>;
export type DoctorDocument = HydratedDocument<IDoctor>;

const doctorSchema = new Schema<IDoctor, DoctorModel>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    experience: { type: Number, required: true, min: 0 },
    availability: { type: Boolean, required: true, default: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

doctorSchema.index({ hospitalId: 1, specialization: 1 });
doctorSchema.index({ hospitalId: 1, department: 1 });

export const Doctor = model<IDoctor, DoctorModel>("Doctor", doctorSchema);
