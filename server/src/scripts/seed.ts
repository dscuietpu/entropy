import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectToDatabase } from "../config/db";
import {
  Ambulance,
  Appointment,
  Doctor,
  Equipment,
  Hospital,
  Issue,
  MedicalShop,
  Review,
  User,
} from "../models";
import {
  buildEquipmentEmbeddingText,
  buildHospitalEmbeddingText,
  buildMedicalShopEmbeddingText,
} from "../utils/buildEmbeddingText";

const DEMO_PASSWORD = "Demo123!";
const SEED_HOSPITAL_NAME = "City General Hospital (Demo)";

const hashPassword = (plain: string): string => bcrypt.hashSync(plain, 10);

const refreshAverageRating = async (
  targetType: "hospital" | "doctor",
  targetId: mongoose.Types.ObjectId
): Promise<void> => {
  const [row] = await Review.aggregate<{ avg: number }>([
    { $match: { targetType, targetId } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);
  const avg = Number((row?.avg ?? 0).toFixed(2));
  if (targetType === "hospital") {
    await Hospital.findByIdAndUpdate(targetId, { averageRating: avg });
  } else {
    await Doctor.findByIdAndUpdate(targetId, { averageRating: avg });
  }
};

async function run(): Promise<void> {
  await connectToDatabase();

  const hospitalExists = await Hospital.exists({ name: SEED_HOSPITAL_NAME });
  const demoUserExists = await User.exists({ email: "patient.demo@hackathon.local" });
  if (hospitalExists || demoUserExists) {
    console.log(
      "[seed] Skipped: demo data already present (marker hospital or patient.demo@hackathon.local)."
    );
    await mongoose.disconnect();
    return;
  }

  console.log("[seed] Inserting demo data…");

  const pwd = hashPassword(DEMO_PASSWORD);

  const hospital1Payload = {
    name: SEED_HOSPITAL_NAME,
    description:
      "Full-service tertiary care with 24/7 emergency, cardiology, and orthopedics. Teaching hospital with modern ICU.",
    address: "Plot 42, Health Park Road, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400069",
    location: { lat: 19.1136, lng: 72.8697 },
    specialties: ["Cardiology", "Orthopedics", "Emergency Medicine", "Neurology"],
    facilities: ["ICU", "MRI", "Blood Bank", "Pharmacy"],
    departments: ["Emergency", "Surgery", "Radiology"],
    contactNumber: "+91-22-4000-1000",
    emergencyContact: "+91-22-4000-9111",
    ambulanceCount: 2,
    averageRating: 0,
    availabilityStatus: "busy" as const,
    embeddingText: "",
    embedding: [] as number[],
  };

  hospital1Payload.embeddingText = buildHospitalEmbeddingText({
    name: hospital1Payload.name,
    description: hospital1Payload.description,
    address: hospital1Payload.address,
    city: hospital1Payload.city,
    state: hospital1Payload.state,
    specialties: hospital1Payload.specialties,
    facilities: hospital1Payload.facilities,
    departments: hospital1Payload.departments,
  });

  const hospital1 = await Hospital.create(hospital1Payload);

  const hospital2Payload = {
    name: "Lakeside Multispecialty Hospital (Demo)",
    description:
      "Boutique hospital focused on family medicine, pediatrics, and minimally invasive surgery. Lake-view recovery suites.",
    address: "88 Lakeside Avenue, Koramangala",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    location: { lat: 12.9352, lng: 77.6245 },
    specialties: ["Pediatrics", "General Surgery", "Internal Medicine"],
    facilities: ["NICU", "Dialysis", "Cafeteria"],
    departments: ["Pediatrics", "Surgery", "Internal Medicine"],
    contactNumber: "+91-80-5000-2200",
    emergencyContact: "+91-80-5000-9111",
    ambulanceCount: 1,
    averageRating: 0,
    availabilityStatus: "free" as const,
    embeddingText: "",
    embedding: [] as number[],
  };

  hospital2Payload.embeddingText = buildHospitalEmbeddingText({
    name: hospital2Payload.name,
    description: hospital2Payload.description,
    address: hospital2Payload.address,
    city: hospital2Payload.city,
    state: hospital2Payload.state,
    specialties: hospital2Payload.specialties,
    facilities: hospital2Payload.facilities,
    departments: hospital2Payload.departments,
  });

  const hospital2 = await Hospital.create(hospital2Payload);

  const patient = await User.create({
    name: "Ananya Desai",
    email: "patient.demo@hackathon.local",
    password: pwd,
    phone: "+91-90000-11111",
    role: "patient",
  });

  const admin1 = await User.create({
    name: "Rohit Iyer",
    email: "admin.city@hackathon.local",
    password: pwd,
    phone: "+91-90000-22222",
    role: "hospital_admin",
    linkedHospitalId: hospital1._id,
  });

  const admin2 = await User.create({
    name: "Kavitha Nair",
    email: "admin.lakeside@hackathon.local",
    password: pwd,
    phone: "+91-90000-33333",
    role: "hospital_admin",
    linkedHospitalId: hospital2._id,
  });

  const doctorUser = await User.create({
    name: "Dr. Vikram Singh",
    email: "doctor.demo@hackathon.local",
    password: pwd,
    phone: "+91-90000-44444",
    role: "doctor",
    linkedHospitalId: hospital1._id,
  });

  const doc1 = await Doctor.create({
    hospitalId: hospital1._id,
    name: "Dr. Priya Sharma",
    specialization: "Cardiology",
    department: "Cardiology",
    experience: 12,
    availability: true,
    averageRating: 0,
  });

  const doc2 = await Doctor.create({
    hospitalId: hospital1._id,
    name: "Dr. Arjun Mehta",
    specialization: "Orthopedics",
    department: "Orthopedics",
    experience: 8,
    availability: true,
    averageRating: 0,
  });

  const doc3 = await Doctor.create({
    hospitalId: hospital2._id,
    name: "Dr. Neha Kapoor",
    specialization: "Pediatrics",
    department: "Pediatrics",
    experience: 15,
    availability: true,
    averageRating: 0,
  });

  const eq1Text = buildEquipmentEmbeddingText({
    name: "Portable X-Ray Unit PX-200",
    type: "Imaging",
    hospitalSection: "Radiology",
  });
  const eq2Text = buildEquipmentEmbeddingText({
    name: "Ventilator V300",
    type: "Life support",
    hospitalSection: "ICU",
  });
  const eq3Text = buildEquipmentEmbeddingText({
    name: "Patient Monitor MX-400",
    type: "Monitoring",
    hospitalSection: "Emergency",
  });

  await Equipment.create({
    hospitalId: hospital1._id,
    name: "Portable X-Ray Unit PX-200",
    type: "Imaging",
    status: "available",
    hospitalSection: "Radiology",
    embeddingText: eq1Text,
    embedding: [],
  });

  await Equipment.create({
    hospitalId: hospital1._id,
    name: "Ventilator V300",
    type: "Life support",
    status: "in-use",
    hospitalSection: "ICU",
    assignedTo: doc1._id,
    lastUsedBy: doc1._id,
    embeddingText: eq2Text,
    embedding: [],
  });

  await Equipment.create({
    hospitalId: hospital1._id,
    name: "Patient Monitor MX-400",
    type: "Monitoring",
    status: "available",
    hospitalSection: "Emergency",
    embeddingText: eq3Text,
    embedding: [],
  });

  const eq4Text = buildEquipmentEmbeddingText({
    name: "Infusion Pump IP-50",
    type: "Infusion",
    hospitalSection: "Pediatrics Ward",
  });

  await Equipment.create({
    hospitalId: hospital2._id,
    name: "Infusion Pump IP-50",
    type: "Infusion",
    status: "maintenance",
    hospitalSection: "Pediatrics Ward",
    embeddingText: eq4Text,
    embedding: [],
  });

  await Ambulance.create({
    hospitalId: hospital1._id,
    vehicleNumber: "MH-01-AB-1001",
    driverName: "Sunil Patil",
    contactNumber: "+91-91000-10001",
    status: "available",
    currentLocation: "Andheri East — Bay 2",
  });

  await Ambulance.create({
    hospitalId: hospital1._id,
    vehicleNumber: "MH-01-AB-1002",
    driverName: "Imran Shaikh",
    contactNumber: "+91-91000-10002",
    status: "busy",
    currentLocation: "Western Express Highway — en route",
  });

  await Ambulance.create({
    hospitalId: hospital2._id,
    vehicleNumber: "KA-01-CD-2001",
    driverName: "Ramesh K.",
    contactNumber: "+91-91000-20001",
    status: "available",
    currentLocation: "Koramangala — standby",
  });

  const shop1Text = buildMedicalShopEmbeddingText({
    name: "HealthPlus Pharmacy — Andheri",
    area: "Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400069",
    availableMedicines: ["Paracetamol", "Insulin", "Antiseptics", "ORS"],
  });

  await MedicalShop.create({
    name: "HealthPlus Pharmacy — Andheri",
    area: "Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400069",
    location: { lat: 19.115, lng: 72.87 },
    contactNumber: "+91-92000-30001",
    availableMedicines: ["Paracetamol", "Insulin", "Antiseptics", "ORS"],
    embeddingText: shop1Text,
    embedding: [],
  });

  const shop2Text = buildMedicalShopEmbeddingText({
    name: "Wellness Meds — Koramangala",
    area: "Koramangala",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    availableMedicines: ["Vitamins", "Pediatric syrups", "Bandages"],
  });

  await MedicalShop.create({
    name: "Wellness Meds — Koramangala",
    area: "Koramangala",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    location: { lat: 12.934, lng: 77.625 },
    contactNumber: "+91-92000-40001",
    availableMedicines: ["Vitamins", "Pediatric syrups", "Bandages"],
    embeddingText: shop2Text,
    embedding: [],
  });

  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  inThreeDays.setHours(10, 30, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 9);
  nextWeek.setHours(15, 0, 0, 0);

  await Appointment.create({
    patientId: patient._id,
    hospitalId: hospital1._id,
    doctorId: doc1._id,
    caseSummary: "Follow-up for mild chest discomfort; ECG review requested.",
    appointmentDate: inThreeDays,
    status: "confirmed",
  });

  await Appointment.create({
    patientId: patient._id,
    hospitalId: hospital2._id,
    doctorId: doc3._id,
    caseSummary: "Routine pediatric vaccination consult.",
    appointmentDate: nextWeek,
    status: "pending",
  });

  await Issue.create({
    createdBy: patient._id,
    roleType: "patient",
    issueType: "equipment-shortage",
    title: "Need portable oxygen concentrators in waiting area",
    description:
      "During peak hours the emergency waiting zone gets crowded; a few portable oxygen units would help stabilize patients before triage.",
    hospitalId: hospital1._id,
    status: "open",
    attachments: [],
  });

  await Issue.create({
    createdBy: admin1._id,
    roleType: "hospital",
    issueType: "general",
    title: "Coordinate blood donation drive with nearby clinics",
    description:
      "Looking to align a weekend blood drive with two partner clinics to replenish rare blood group inventory.",
    hospitalId: hospital1._id,
    status: "in-progress",
    attachments: [],
  });

  await Review.create({
    targetType: "hospital",
    targetId: hospital1._id,
    rating: 5,
    comment:
      "Emergency team was fast and clear. Billing desk explained insurance steps patiently.",
    createdBy: patient._id,
  });

  await Review.create({
    targetType: "hospital",
    targetId: hospital2._id,
    rating: 4,
    comment: "Pediatrics ward is calm and child-friendly; slightly long wait at registration.",
    createdBy: patient._id,
  });

  await Review.create({
    targetType: "doctor",
    targetId: doc1._id,
    rating: 5,
    comment: "Dr. Sharma explained the treatment plan in detail; felt reassured throughout.",
    createdBy: patient._id,
  });

  await Review.create({
    targetType: "doctor",
    targetId: doc2._id,
    rating: 5,
    comment: "Straightforward advice on knee rehab exercises; staff coordinated physio slots quickly.",
    createdBy: patient._id,
  });

  await Review.create({
    targetType: "doctor",
    targetId: doc3._id,
    rating: 4,
    comment: "Great with kids; appointment ran a few minutes late but worth it.",
    createdBy: patient._id,
  });

  await refreshAverageRating("hospital", hospital1._id);
  await refreshAverageRating("hospital", hospital2._id);
  await refreshAverageRating("doctor", doc1._id);
  await refreshAverageRating("doctor", doc2._id);
  await refreshAverageRating("doctor", doc3._id);

  console.log("[seed] Done.");
  console.log(`[seed] Demo login password for all users: ${DEMO_PASSWORD}`);
  console.log("[seed] Users:");
  console.log(`  patient:     ${patient.email}`);
  console.log(`  admin (H1):  ${admin1.email}`);
  console.log(`  admin (H2):  ${admin2.email}`);
  console.log(`  doctor user: ${doctorUser.email}`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("[seed] Failed:", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
