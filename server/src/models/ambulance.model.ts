import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export const AMBULANCE_STATUSES = ["available", "busy", "maintenance"] as const;
export type AmbulanceStatus = (typeof AMBULANCE_STATUSES)[number];

export interface IAmbulance {
  hospitalId: Types.ObjectId;
  vehicleNumber: string;
  driverName: string;
  contactNumber: string;
  status: AmbulanceStatus;
  currentLocation?: string;
}

type AmbulanceModel = Model<IAmbulance>;
export type AmbulanceDocument = HydratedDocument<IAmbulance>;

const ambulanceSchema = new Schema<IAmbulance, AmbulanceModel>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    vehicleNumber: { type: String, required: true, trim: true },
    driverName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: AMBULANCE_STATUSES, default: "available", required: true },
    currentLocation: { type: String, trim: true },
  },
  { timestamps: true }
);

ambulanceSchema.index({ hospitalId: 1, status: 1 });
ambulanceSchema.index({ hospitalId: 1, vehicleNumber: 1 }, { unique: true });

export const Ambulance = model<IAmbulance, AmbulanceModel>("Ambulance", ambulanceSchema);
