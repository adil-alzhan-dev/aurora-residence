import { z } from "zod";

const residenceStatus = z.enum(["AVAILABLE", "RESERVED", "SOLD"]);
const enquiryStatus = z.enum(["NEW", "IN_PROGRESS", "CLOSED"]);

export type AdminResidenceStatus = z.infer<typeof residenceStatus>;
export type AdminEnquiryStatus = z.infer<typeof enquiryStatus>;

export const meSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: z.enum(["ADMIN", "MANAGER"]),
});

export type AdminMe = z.infer<typeof meSchema>;

const dashboardEnquirySchema = z.object({
  id: z.number(),
  createdAt: z.coerce.date(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  status: enquiryStatus,
  source: z.string(),
  residence: z
    .object({ number: z.string(), bedrooms: z.number().int(), areaM2: z.number(), priceUsd: z.number() })
    .nullable(),
});

export type DashboardEnquiry = z.infer<typeof dashboardEnquirySchema>;
export type ResidenceBrief = NonNullable<DashboardEnquiry["residence"]>;

export const dashboardSchema = z.object({
  residences: z.object({
    AVAILABLE: z.number(),
    RESERVED: z.number(),
    SOLD: z.number(),
    total: z.number(),
  }),
  enquiries: z.object({ total: z.number(), new: z.number(), newToday: z.number() }),
  facade: z.array(z.object({ number: z.string(), status: residenceStatus })),
  reservations: z.array(
    z.object({
      residence: z.string(),
      client: z.string().nullable(),
      expiresAt: z.coerce.date(),
      endingSoon: z.boolean(),
    }),
  ),
  latestEnquiries: z.array(dashboardEnquirySchema),
});

export type DashboardSummary = z.infer<typeof dashboardSchema>;
