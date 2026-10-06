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

export const adminResidenceSchema = z.object({
  number: z.string(),
  floor: z.number().int(),
  position: z.number().int(),
  bedrooms: z.number().int(),
  areaM2: z.number(),
  isPenthouse: z.boolean(),
  priceUsd: z.number(),
  status: residenceStatus,
  side: z.string(),
  view: z.string(),
  statusChangedAt: z.coerce.date(),
  reservedUntil: z.coerce.date().nullable(),
});

export type AdminResidence = z.infer<typeof adminResidenceSchema>;

export const residenceListSchema = z.object({
  items: z.array(adminResidenceSchema),
  counts: z.object({ AVAILABLE: z.number(), RESERVED: z.number(), SOLD: z.number() }),
});

export type ResidenceList = z.infer<typeof residenceListSchema>;

const activityEntrySchema = z.object({
  at: z.coerce.date(),
  type: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  note: z.string().nullable(),
  author: z.string(),
});

export type ActivityEntry = z.infer<typeof activityEntrySchema>;

export const residenceCardSchema = adminResidenceSchema.extend({
  reservation: z
    .object({
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date(),
      enquiry: z.object({ id: z.number(), name: z.string() }).nullable(),
      createdBy: z.string(),
    })
    .nullable(),
  history: z.array(activityEntrySchema),
});

export type ResidenceCard = z.infer<typeof residenceCardSchema>;

export const reservationStateSchema = z.object({ number: z.string(), status: residenceStatus });

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

export type EnquiryList = z.infer<typeof enquiryListSchema>;

export const enquiryCardSchema = enquiryListItemSchema.extend({
  comment: z.string().nullable(),
  locale: z.string(),
  currency: z.string(),
  managerNote: z.string().nullable(),
  updatedAt: z.coerce.date(),
  residence: z
    .object({
      number: z.string(),
      status: residenceStatus,
      priceUsd: z.number(),
      bedrooms: z.number().int(),
      areaM2: z.number(),
      isPenthouse: z.boolean(),
    })
    .nullable(),
  reservation: z.object({ startsAt: z.coerce.date(), endsAt: z.coerce.date() }).nullable(),
  activity: z.array(activityEntrySchema.extend({ residence: z.string().nullable() })),
});

export type EnquiryCard = z.infer<typeof enquiryCardSchema>;
export type EnquiryActivity = EnquiryCard["activity"][number];
