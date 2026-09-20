import { z } from "../../../shared/openapi/zod.js";

const HHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):(00|30)$/, "Time must be HH:MM on the hour or half hour");

export const ViewingStatusEnum = z
  .enum(["REQUESTED", "RESCHEDULE_PROPOSED", "CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED", "NO_SHOW", "EXPIRED"])
  .openapi("ViewingStatus");

export const AvailabilitySchema = z
  .object({
    timezone: z.literal("Africa/Cairo"),
    windows: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6).openapi({ description: "0 = Sunday … 6 = Saturday" }),
          startTime: HHMM,
          endTime: HHMM,
        })
      )
      .max(50),
    blackouts: z.array(z.string().date()).max(366).openapi({ description: "Dates (YYYY-MM-DD) with no viewings" }),
  })
  .openapi("Availability");

export const UpdateAvailabilitySchema = AvailabilitySchema.omit({ timezone: true }).openapi("UpdateAvailability");

export const ViewingSlotsQuerySchema = z.object({
  from: z.string().date().optional().openapi({ description: "First Cairo date (default: today)" }),
  to: z.string().date().optional().openapi({ description: "Last Cairo date (default and maximum: 30 days ahead)" }),
});

export const ViewingSlotsResponseSchema = z
  .object({
    timezone: z.literal("Africa/Cairo"),
    durationMinutes: z.literal(60),
    slots: z.array(z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime() })),
  })
  .openapi("ViewingSlots");

export const CreateViewingSchema = z
  .object({
    propertyId: z.string().uuid(),
    startsAt: z.string().datetime().openapi({ description: "Must be one of the listing's available slots" }),
    note: z.string().trim().max(500).optional(),
  })
  .openapi("CreateViewing");

export const ProposeRescheduleSchema = z.object({ startsAt: z.string().datetime() }).openapi("ProposeReschedule");
export const OptionalReasonSchema = z.object({ reason: z.string().trim().max(500).optional() }).openapi("OptionalReason");
export const RequiredReasonSchema = z.object({ reason: z.string().trim().min(3).max(500) }).openapi("RequiredReason");

const PartySchema = z.object({ id: z.string(), name: z.string() });

export const ViewingResponseSchema = z
  .object({
    id: z.string(),
    status: ViewingStatusEnum,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    note: z.string().nullable(),
    cancellationReason: z.string().nullable(),
    cancelledBy: z.enum(["USER", "AGENT", "ADMIN", "AI_TOOL", "SYSTEM"]).nullable(),
    property: z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string().nullable(),
      imageUrl: z.string().nullable(),
    }),
    agent: PartySchema.openapi({ description: "Listing agent. Never includes a phone number (#60)" }),
    buyer: PartySchema.nullable().openapi({ description: "Present only for the agent's view; no phone (#66)" }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Viewing");

export const ViewingScopeEnum = z.enum(["pending", "upcoming", "past"]);

export const ViewingListQuerySchema = z.object({
  scope: ViewingScopeEnum,
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AgentViewingListQuerySchema = ViewingListQuerySchema.extend({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const ViewingListResponseSchema = z
  .object({
    items: z.array(ViewingResponseSchema),
    pageInfo: z.object({ nextCursor: z.string().nullable(), hasNextPage: z.boolean() }),
  })
  .openapi("ViewingList");

export type ViewingResponse = z.infer<typeof ViewingResponseSchema>;

export * from "./offer.schema.js";
