import { Request, Response } from "express";

import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  getAppointments,
  updateAppointment,
} from "../services/appointment.service";
import { jsonSuccess } from "../utils/respond";

export const listAppointments = async (req: Request, res: Response): Promise<void> => {
  const result = await getAppointments({
    search: req.query.search as string | undefined,
    patientId: req.query.patientId as string | undefined,
    hospitalId: req.query.hospitalId as string | undefined,
    doctorId: req.query.doctorId as string | undefined,
    status: req.query.status as string | undefined,
    city: req.query.city as string | undefined,
    state: req.query.state as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    order: req.query.order as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const getAppointment = async (req: Request, res: Response): Promise<void> => {
  const appointment = await getAppointmentById(req.params.id);

  jsonSuccess(res, { data: appointment });
};

export const createAppointmentRecord = async (req: Request, res: Response): Promise<void> => {
  const appointment = await createAppointment({
    patientId: req.body.patientId,
    hospitalId: req.body.hospitalId,
    doctorId: req.body.doctorId,
    caseSummary: req.body.caseSummary,
    appointmentDate: req.body.appointmentDate,
    status: req.body.status,
  });

  jsonSuccess(res, { message: "Appointment created successfully", data: appointment }, 201);
};

export const patchAppointment = async (req: Request, res: Response): Promise<void> => {
  const appointment = await updateAppointment(req.params.id, {
    patientId: req.body.patientId,
    hospitalId: req.body.hospitalId,
    doctorId: req.body.doctorId,
    caseSummary: req.body.caseSummary,
    appointmentDate: req.body.appointmentDate,
    status: req.body.status,
  });

  jsonSuccess(res, { message: "Appointment updated successfully", data: appointment });
};

export const removeAppointment = async (req: Request, res: Response): Promise<void> => {
  await deleteAppointment(req.params.id);

  jsonSuccess(res, { message: "Appointment deleted successfully" });
};
