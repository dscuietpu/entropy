import { ambulanceService } from "@/services/ambulance.service";
import { appointmentService } from "@/services/appointment.service";
import { doctorService } from "@/services/doctor.service";
import { equipmentService } from "@/services/equipment.service";
import { hospitalService } from "@/services/hospital.service";
import { issueService } from "@/services/issue.service";
import type { Hospital } from "@/types";

interface HospitalStats {
  doctorCount?: number;
  equipmentCount?: number;
  ambulanceCount?: number;
  appointmentCount?: number;
  issueCount?: number;
  reviewCount?: number;
}

interface HospitalDetailWithStats extends Hospital {
  stats?: HospitalStats;
}

export interface HospitalDashboardMetrics {
  hospital: HospitalDetailWithStats;
  summary: {
    totalDoctors: number;
    totalEquipment: number;
    availableEquipment: number;
    totalAmbulances: number;
    pendingAppointments: number;
    openIssues: number;
  };
}

export async function getHospitalDashboardMetrics(hospitalId: string, token: string) {
  const [
    hospital,
    doctorResponse,
    totalEquipmentResponse,
    availableEquipmentResponse,
    ambulanceResponse,
    pendingAppointmentResponse,
    openIssueResponse,
  ] = await Promise.all([
    hospitalService.getById(hospitalId) as Promise<HospitalDetailWithStats>,
    doctorService.listByHospital(hospitalId, 1),
    equipmentService.list({
      hospitalId,
      limit: 1,
    }),
    equipmentService.list({
      hospitalId,
      status: "available",
      limit: 1,
    }),
    ambulanceService.list({
      hospitalId,
      limit: 1,
    }),
    appointmentService.list(
      {
        hospitalId,
        status: "pending",
        limit: 1,
      },
      token,
    ),
    issueService.list({
      hospitalId,
      status: "open",
      limit: 1,
    }),
  ]);

  return {
    hospital,
    summary: {
      totalDoctors: hospital.stats?.doctorCount ?? doctorResponse.pagination.total,
      totalEquipment: hospital.stats?.equipmentCount ?? totalEquipmentResponse.pagination.total,
      availableEquipment: availableEquipmentResponse.pagination.total,
      totalAmbulances: hospital.stats?.ambulanceCount ?? ambulanceResponse.pagination.total,
      pendingAppointments: pendingAppointmentResponse.pagination.total,
      openIssues: openIssueResponse.pagination.total,
    },
  } satisfies HospitalDashboardMetrics;
}
