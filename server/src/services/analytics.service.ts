import { PipelineStage, Types, isValidObjectId } from "mongoose";

import {
  Ambulance,
  Appointment,
  Doctor,
  Equipment,
  Hospital,
  Issue,
  Review,
  User,
} from "../models";
import { HttpError } from "../utils/http-error";

interface AnalyticsScopeInput {
  userId: string;
  hospitalId?: string;
}

interface AnalyticsScope {
  hospitalId: Types.ObjectId;
  hospitalName: string;
}

interface DistributionItem {
  label: string;
  count: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

const getTrendStartDate = (days: number): Date => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setTime(start.getTime() - (days - 1) * DAY_IN_MS);
  return start;
};

const normalizeTrend = (
  rows: Array<{ _id: string; count: number }>,
  days: number
): TrendPoint[] => {
  const map = new Map(rows.map((row) => [row._id, row.count]));
  const points: TrendPoint[] = [];
  const start = getTrendStartDate(days);

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start.getTime() + index * DAY_IN_MS);
    const key = toDayKey(date);

    points.push({
      date: key,
      count: map.get(key) ?? 0,
    });
  }

  return points;
};

const buildTrendPipeline = (
  hospitalId: Types.ObjectId,
  dateField: string,
  days: number
): PipelineStage[] => [
  {
    $match: {
      hospitalId,
      [dateField]: { $gte: getTrendStartDate(days) },
    },
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: `$${dateField}`,
        },
      },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
];

const resolveAnalyticsScope = async ({
  userId,
  hospitalId,
}: AnalyticsScopeInput): Promise<AnalyticsScope> => {
  let resolvedHospitalId: Types.ObjectId | undefined;

  if (hospitalId) {
    if (!isValidObjectId(hospitalId)) {
      throw new HttpError(400, "Invalid hospitalId");
    }
    resolvedHospitalId = new Types.ObjectId(hospitalId);
  } else {
    if (!isValidObjectId(userId)) {
      throw new HttpError(400, "Invalid user id");
    }

    const user = await User.findById(userId).select("linkedHospitalId").lean();
    if (!user?.linkedHospitalId) {
      throw new HttpError(400, "No linkedHospitalId found for the current user");
    }

    resolvedHospitalId = user.linkedHospitalId as Types.ObjectId;
  }

  const hospital = await Hospital.findById(resolvedHospitalId).select("name").lean();
  if (!hospital) {
    throw new HttpError(404, "Hospital not found");
  }

  return {
    hospitalId: resolvedHospitalId,
    hospitalName: hospital.name,
  };
};

export const getAnalyticsOverview = async (scopeInput: AnalyticsScopeInput) => {
  const scope = await resolveAnalyticsScope(scopeInput);

  const [
    doctorCount,
    equipmentCount,
    ambulanceCount,
    appointmentCount,
    issueCount,
    reviewCount,
    equipmentStatus,
    appointmentStatus,
    issueStatus,
    last7AppointmentsRaw,
    last30AppointmentsRaw,
    last7IssuesRaw,
    last30IssuesRaw,
  ] = await Promise.all([
    Doctor.countDocuments({ hospitalId: scope.hospitalId }),
    Equipment.countDocuments({ hospitalId: scope.hospitalId }),
    Ambulance.countDocuments({ hospitalId: scope.hospitalId }),
    Appointment.countDocuments({ hospitalId: scope.hospitalId }),
    Issue.countDocuments({ hospitalId: scope.hospitalId }),
    Review.countDocuments({ targetType: "hospital", targetId: scope.hospitalId }),
    Equipment.aggregate<DistributionItem>([
      { $match: { hospitalId: scope.hospitalId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, label: "$_id", count: 1 } },
      { $sort: { label: 1 } },
    ]),
    Appointment.aggregate<DistributionItem>([
      { $match: { hospitalId: scope.hospitalId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, label: "$_id", count: 1 } },
      { $sort: { label: 1 } },
    ]),
    Issue.aggregate<DistributionItem>([
      { $match: { hospitalId: scope.hospitalId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, label: "$_id", count: 1 } },
      { $sort: { label: 1 } },
    ]),
    Appointment.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "appointmentDate", 7)
    ),
    Appointment.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "appointmentDate", 30)
    ),
    Issue.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "createdAt", 7)
    ),
    Issue.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "createdAt", 30)
    ),
  ]);

  return {
    hospital: {
      id: scope.hospitalId.toString(),
      name: scope.hospitalName,
    },
    totals: {
      doctors: doctorCount,
      equipment: equipmentCount,
      ambulances: ambulanceCount,
      appointments: appointmentCount,
      issues: issueCount,
      reviews: reviewCount,
    },
    distributions: {
      equipmentStatus,
      appointmentStatus,
      issueStatus,
    },
    trends: {
      appointments: {
        last7Days: normalizeTrend(last7AppointmentsRaw, 7),
        last30Days: normalizeTrend(last30AppointmentsRaw, 30),
      },
      issues: {
        last7Days: normalizeTrend(last7IssuesRaw, 7),
        last30Days: normalizeTrend(last30IssuesRaw, 30),
      },
    },
  };
};

export const getEquipmentAnalytics = async (scopeInput: AnalyticsScopeInput) => {
  const scope = await resolveAnalyticsScope(scopeInput);

  const [summary] = await Equipment.aggregate<{
    total: number;
    statusDistribution: DistributionItem[];
    topTypes: Array<{ type: string; count: number }>;
  }>([
    { $match: { hospitalId: scope.hospitalId } },
    {
      $facet: {
        totals: [{ $count: "count" }],
        statusDistribution: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, label: "$_id", count: 1 } },
          { $sort: { label: 1 } },
        ],
        topTypes: [
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 5 },
          { $project: { _id: 0, type: "$_id", count: 1 } },
        ],
      },
    },
    {
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ["$totals.count", 0] }, 0] },
        statusDistribution: 1,
        topTypes: 1,
      },
    },
  ]);

  const [last7Raw, last30Raw] = await Promise.all([
    Equipment.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "createdAt", 7)
    ),
    Equipment.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "createdAt", 30)
    ),
  ]);

  return {
    hospital: {
      id: scope.hospitalId.toString(),
      name: scope.hospitalName,
    },
    totals: {
      equipment: summary?.total ?? 0,
    },
    statusDistribution: summary?.statusDistribution ?? [],
    mostUsedEquipmentTypes: summary?.topTypes ?? [],
    trends: {
      last7Days: normalizeTrend(last7Raw, 7),
      last30Days: normalizeTrend(last30Raw, 30),
    },
  };
};

export const getIssueAnalytics = async (scopeInput: AnalyticsScopeInput) => {
  const scope = await resolveAnalyticsScope(scopeInput);

  const [summary] = await Issue.aggregate<{
    total: number;
    statusDistribution: DistributionItem[];
    topIssueTypes: Array<{ issueType: string; count: number }>;
  }>([
    { $match: { hospitalId: scope.hospitalId } },
    {
      $facet: {
        totals: [{ $count: "count" }],
        statusDistribution: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, label: "$_id", count: 1 } },
          { $sort: { label: 1 } },
        ],
        topIssueTypes: [
          { $group: { _id: "$issueType", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 5 },
          { $project: { _id: 0, issueType: "$_id", count: 1 } },
        ],
      },
    },
    {
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ["$totals.count", 0] }, 0] },
        statusDistribution: 1,
        topIssueTypes: 1,
      },
    },
  ]);

  const [last7Raw, last30Raw] = await Promise.all([
    Issue.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "createdAt", 7)
    ),
    Issue.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "createdAt", 30)
    ),
  ]);

  return {
    hospital: {
      id: scope.hospitalId.toString(),
      name: scope.hospitalName,
    },
    totals: {
      issues: summary?.total ?? 0,
    },
    statusDistribution: summary?.statusDistribution ?? [],
    topIssueTypes: summary?.topIssueTypes ?? [],
    trends: {
      last7Days: normalizeTrend(last7Raw, 7),
      last30Days: normalizeTrend(last30Raw, 30),
    },
  };
};

export const getAppointmentAnalytics = async (scopeInput: AnalyticsScopeInput) => {
  const scope = await resolveAnalyticsScope(scopeInput);

  const [summary] = await Appointment.aggregate<{
    total: number;
    statusDistribution: DistributionItem[];
  }>([
    { $match: { hospitalId: scope.hospitalId } },
    {
      $facet: {
        totals: [{ $count: "count" }],
        statusDistribution: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, label: "$_id", count: 1 } },
          { $sort: { label: 1 } },
        ],
      },
    },
    {
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ["$totals.count", 0] }, 0] },
        statusDistribution: 1,
      },
    },
  ]);

  const [last7Raw, last30Raw] = await Promise.all([
    Appointment.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "appointmentDate", 7)
    ),
    Appointment.aggregate<{ _id: string; count: number }>(
      buildTrendPipeline(scope.hospitalId, "appointmentDate", 30)
    ),
  ]);

  return {
    hospital: {
      id: scope.hospitalId.toString(),
      name: scope.hospitalName,
    },
    totals: {
      appointments: summary?.total ?? 0,
    },
    statusDistribution: summary?.statusDistribution ?? [],
    trends: {
      last7Days: normalizeTrend(last7Raw, 7),
      last30Days: normalizeTrend(last30Raw, 30),
    },
  };
};
