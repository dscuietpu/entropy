import { HydratedDocument, Model, Schema, model } from "mongoose";

export const HOSPITAL_AVAILABILITY_STATUSES = ["free", "busy"] as const;
export type HospitalAvailabilityStatus = (typeof HOSPITAL_AVAILABILITY_STATUSES)[number];

interface IGeoPoint {
  lat: number;
  lng: number;
}

export interface IHospital {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: IGeoPoint;
  specialties: string[];
  facilities: string[];
  departments: string[];
  contactNumber: string;
  emergencyContact: string;
  ambulanceCount: number;
  averageRating: number;
  availabilityStatus: HospitalAvailabilityStatus;
  embeddingText: string;
  embedding: number[];
}

type HospitalModel = Model<IHospital>;
export type HospitalDocument = HydratedDocument<IHospital>;

const geoPointSchema = new Schema<IGeoPoint>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const hospitalSchema = new Schema<IHospital, HospitalModel>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    location: { type: geoPointSchema, required: true },
    specialties: { type: [String], default: [] },
    facilities: { type: [String], default: [] },
    departments: { type: [String], default: [] },
    contactNumber: { type: String, required: true, trim: true },
    emergencyContact: { type: String, required: true, trim: true },
    ambulanceCount: { type: Number, required: true, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    availabilityStatus: {
      type: String,
      enum: HOSPITAL_AVAILABILITY_STATUSES,
      default: "free",
      required: true,
    },
    embeddingText: { type: String, required: true, trim: true },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

hospitalSchema.index({ city: 1, state: 1 });
hospitalSchema.index({ state: 1, city: 1 });
hospitalSchema.index({ specialties: 1 });
hospitalSchema.index({ facilities: 1 });
hospitalSchema.index({ departments: 1 });
hospitalSchema.index({ "location.lat": 1, "location.lng": 1 });

export const Hospital = model<IHospital, HospitalModel>("Hospital", hospitalSchema);
