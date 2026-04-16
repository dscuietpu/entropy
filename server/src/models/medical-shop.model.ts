import { HydratedDocument, Model, Schema, model } from "mongoose";

interface IGeoPoint {
  lat: number;
  lng: number;
}

export interface IMedicalShop {
  name: string;
  area: string;
  city: string;
  state: string;
  pincode?: string;
  location: IGeoPoint;
  contactNumber: string;
  availableMedicines: string[];
  embeddingText: string;
  embedding: number[];
}

type MedicalShopModel = Model<IMedicalShop>;
export type MedicalShopDocument = HydratedDocument<IMedicalShop>;

const geoPointSchema = new Schema<IGeoPoint>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const medicalShopSchema = new Schema<IMedicalShop, MedicalShopModel>(
  {
    name: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    location: { type: geoPointSchema, required: true },
    contactNumber: { type: String, required: true, trim: true },
    availableMedicines: { type: [String], default: [] },
    embeddingText: { type: String, required: true, trim: true },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

medicalShopSchema.index({ area: 1, city: 1, state: 1 });
medicalShopSchema.index({ city: 1, state: 1 });
medicalShopSchema.index({ availableMedicines: 1 });
medicalShopSchema.index({ "location.lat": 1, "location.lng": 1 });

export const MedicalShop = model<IMedicalShop, MedicalShopModel>("MedicalShop", medicalShopSchema);
