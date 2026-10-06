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

export const dashboardSchema = z.object({
  residences: z.object({
    AVAILABLE: z.number(),
    RESERVED: z.number(),
    SOLD: z.number(),
    total: z.number(),
  }),
  enquiries: z.object({
    total: z.number(),
    newToday: z.number(),
    byStatus: z.object({ NEW: z.number(), IN_PROGRESS: z.number(), CLOSED: z.number() }),
  }),
  expiringReservations: z.array(
    z.object({ residence: z.string(), endsAt: z.coerce.date(), client: z.string().nullable() }),
  ),
});

export type DashboardSummary = z.infer<typeof dashboardSchema>;

const adminResidenceSchema = z.object({
  number: z.string(),
  floor: z.number().int(),
  position: z.number().int(),
  bedrooms: z.number().int(),
  areaM2: z.number(),
  isPenthouse: z.boolean(),
  priceUsd: z.number(),
  status: residenceStatus,
  reservedUntil: z.coerce.date().nullable(),
});

export type AdminResidence = z.infer<typeof adminResidenceSchema>;

export const residenceListSchema = z.object({ items: z.array(adminResidenceSchema) });

export const residenceCardSchema = z.object({
  number: z.string(),
  reservation: z
    .object({
      endsAt: z.coerce.date(),
      enquiry: z.object({ id: z.number(), name: z.string() }).nullable(),
    })
    .nullable(),
});

const enquiryListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  status: enquiryStatus,
  source: z.string(),
  residence: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type AdminEnquiryListItem = z.infer<typeof enquiryListItemSchema>;

export const enquiryListSchema = z.object({ items: z.array(enquiryListItemSchema), total: z.number() });
