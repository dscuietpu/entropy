import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export const EQUIPMENT_STATUSES = ["available", "in-use", "maintenance"] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export interface IEquipment {
  hospitalId: Types.ObjectId;
  name: string;
  type: string;
  status: EquipmentStatus;
  hospitalSection: string;
  assignedTo?: Types.ObjectId;
  lastUsedBy?: Types.ObjectId;
  embeddingText: string;
  embedding: number[];
}

type EquipmentModel = Model<IEquipment>;
export type EquipmentDocument = HydratedDocument<IEquipment>;

const equipmentSchema = new Schema<IEquipment, EquipmentModel>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    status: { type: String, enum: EQUIPMENT_STATUSES, default: "available", required: true },
    hospitalSection: { type: String, required: true, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Doctor" },
    lastUsedBy: { type: Schema.Types.ObjectId, ref: "Doctor" },
    embeddingText: { type: String, required: true, trim: true },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

equipmentSchema.index({ hospitalId: 1, status: 1 });
equipmentSchema.index({ hospitalId: 1, type: 1 });
equipmentSchema.index({ hospitalId: 1, name: 1 });

export const Equipment = model<IEquipment, EquipmentModel>("Equipment", equipmentSchema);
