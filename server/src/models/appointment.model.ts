import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export const APPOINTMENT_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface IAppointment {
  patientId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  doctorId: Types.ObjectId;
  caseSummary: string;
  appointmentDate: Date;
  status: AppointmentStatus;
}

type AppointmentModel = Model<IAppointment>;
export type AppointmentDocument = HydratedDocument<IAppointment>;

const appointmentSchema = new Schema<IAppointment, AppointmentModel>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    caseSummary: { type: String, required: true, trim: true },
    appointmentDate: { type: Date, required: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: "pending", required: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ hospitalId: 1, status: 1 });

export const Appointment = model<IAppointment, AppointmentModel>("Appointment", appointmentSchema);
