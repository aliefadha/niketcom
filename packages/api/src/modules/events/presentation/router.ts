import { ORPCError } from "@orpc/server";
import { z } from "zod";
import type { Context } from "../../../context";
import { protectedProcedure, publicProcedure } from "../../../index";
import {
	EventSlugAlreadyExistsError,
	eventSessionStatuses,
	eventStatuses,
	InvalidEventSessionTimeRangeError,
	InvalidEventTitleError,
} from "../domain/events";
import { createDrizzleEventRepository } from "../infrastructure/drizzle-event-repository";
import { createEvent } from "../usecase/create-event";
import { createEventSession } from "../usecase/create-event-session";
import { deleteEvent } from "../usecase/delete-event";
import { deleteEventSession } from "../usecase/delete-event-session";
import { EntityNotFoundError } from "../usecase/errors";
import { getEvent } from "../usecase/get-event";
import { getEventBySlug } from "../usecase/get-event-by-slug";
import { getEventSession } from "../usecase/get-event-session";
import { listEventSessions } from "../usecase/list-event-sessions";
import { listOrganizerEvents } from "../usecase/list-organizer-events";
import { listPublishedEvents } from "../usecase/list-published-events";
import { updateEvent } from "../usecase/update-event";
import { updateEventSession } from "../usecase/update-event-session";

const eventIdSchema = z.string().uuid();

const eventFieldsSchema = z.object({
	title: z.string().trim().min(1),
	slug: z.string().trim().min(1).optional(),
	description: z.string().nullable().optional(),
	imageUrl: z.string().nullable().optional(),
	status: z.enum(eventStatuses).optional(),
	timeZone: z.string(),
});

const eventUpdateFieldsSchema = eventFieldsSchema.partial().refine(hasFields, {
	message: "At least one event field must be provided",
});

const eventSessionFieldsSchema = z.object({
	name: z.string().nullable().optional(),
	startsAt: z.coerce.date(),
	endsAt: z.coerce.date(),
	status: z.enum(eventSessionStatuses).optional(),
	venueName: z.string().nullable().optional(),
	venueAddress: z.string().nullable().optional(),
	onlineUrl: z.string().nullable().optional(),
});

const eventSessionCreateSchema = eventSessionFieldsSchema.refine(
	(data) => data.endsAt > data.startsAt,
	{
		message: "endsAt must be after startsAt",
		path: ["endsAt"],
	},
);

const eventSessionUpdateSchema = eventSessionFieldsSchema
	.partial()
	.refine(hasFields, {
		message: "At least one session field must be provided",
	});

const eventSessionChangesSchema = z.object({
	create: z.array(eventSessionCreateSchema).optional(),
	update: z
		.array(z.object({ id: eventIdSchema, data: eventSessionUpdateSchema }))
		.optional(),
	delete: z.array(eventIdSchema).optional(),
});

const eventUpdateSchema = z
	.object({
		id: eventIdSchema,
		data: eventUpdateFieldsSchema.optional(),
		sessions: eventSessionChangesSchema.optional(),
	})
	.refine(
		(input) =>
			input.data !== undefined ||
			Object.values(input.sessions ?? {}).some(
				(changes) => changes !== undefined && changes.length > 0,
			),
		{ message: "At least one event or session change must be provided" },
	);

function hasFields(value: Record<string, unknown>) {
	return Object.values(value).some((field) => field !== undefined);
}

function getRepository(context: Context) {
	return createDrizzleEventRepository(context.db);
}

function getUserId(context: Context) {
	const userId = context.session?.user.id;
	if (!userId) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return userId;
}

function assertOrganizer(context: Context, organizerId: string) {
	if (organizerId !== getUserId(context)) {
		throw new ORPCError("FORBIDDEN");
	}
}

function assertReadable(context: Context, status: string, organizerId: string) {
	if (status !== "published" && organizerId !== context.session?.user.id) {
		throw new ORPCError("NOT_FOUND");
	}
}

async function invoke<T>(callback: () => Promise<T>): Promise<T> {
	try {
		return await callback();
	} catch (error) {
		if (error instanceof EntityNotFoundError) {
			throw new ORPCError("NOT_FOUND");
		}
		if (
			error instanceof InvalidEventSessionTimeRangeError ||
			error instanceof InvalidEventTitleError
		) {
			throw new ORPCError("BAD_REQUEST", { message: error.message });
		}
		if (error instanceof EventSlugAlreadyExistsError) {
			throw new ORPCError("CONFLICT", { message: error.message });
		}
		throw error;
	}
}

export const eventsRouter = {
	create: protectedProcedure
		.input(
			eventFieldsSchema.extend({
				sessions: z.array(eventSessionCreateSchema).optional(),
			}),
		)
		.handler(({ context, input }) => {
			const { sessions, ...event } = input;
			return invoke(() =>
				createEvent(getRepository(context), {
					event: { ...event, organizerId: getUserId(context) },
					sessions,
				}),
			);
		}),
	list: publicProcedure.handler(({ context }) =>
		listPublishedEvents(getRepository(context)),
	),
	listMine: protectedProcedure.handler(({ context }) =>
		listOrganizerEvents(getRepository(context), getUserId(context)),
	),
	get: publicProcedure
		.input(z.object({ id: eventIdSchema }))
		.handler(async ({ context, input }) => {
			const foundEvent = await getEvent(getRepository(context), input.id);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertReadable(context, foundEvent.status, foundEvent.organizerId);
			return foundEvent;
		}),
	getBySlug: publicProcedure
		.input(z.object({ slug: z.string().trim().min(1) }))
		.handler(async ({ context, input }) => {
			const foundEvent = await getEventBySlug(
				getRepository(context),
				input.slug,
			);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertReadable(context, foundEvent.status, foundEvent.organizerId);
			return foundEvent;
		}),
	update: protectedProcedure
		.input(eventUpdateSchema)
		.handler(async ({ context, input }) => {
			const repository = getRepository(context);
			const foundEvent = await getEvent(repository, input.id);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertOrganizer(context, foundEvent.organizerId);

			return invoke(() =>
				updateEvent(repository, {
					id: input.id,
					event: input.data,
					sessions: input.sessions,
				}),
			);
		}),
	delete: protectedProcedure
		.input(z.object({ id: eventIdSchema }))
		.handler(async ({ context, input }) => {
			const repository = getRepository(context);
			const foundEvent = await getEvent(repository, input.id);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertOrganizer(context, foundEvent.organizerId);
			return invoke(() => deleteEvent(repository, input.id));
		}),
};

export const eventSessionsRouter = {
	create: protectedProcedure
		.input(z.object({ eventId: eventIdSchema, data: eventSessionCreateSchema }))
		.handler(async ({ context, input }) => {
			const repository = getRepository(context);
			const foundEvent = await getEvent(repository, input.eventId);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertOrganizer(context, foundEvent.organizerId);
			return createEventSession(repository, input.eventId, input.data);
		}),
	list: publicProcedure
		.input(z.object({ eventId: eventIdSchema }))
		.handler(async ({ context, input }) => {
			const repository = getRepository(context);
			const foundEvent = await getEvent(repository, input.eventId);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertReadable(context, foundEvent.status, foundEvent.organizerId);
			return listEventSessions(repository, input.eventId);
		}),
	get: publicProcedure
		.input(z.object({ id: eventIdSchema }))
		.handler(async ({ context, input }) => {
			const repository = getRepository(context);
			const foundSession = await getEventSession(repository, input.id);
			if (!foundSession) {
				throw new ORPCError("NOT_FOUND");
			}
			const foundEvent = await getEvent(repository, foundSession.eventId);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertReadable(context, foundEvent.status, foundEvent.organizerId);
			return foundSession;
		}),
	update: protectedProcedure
		.input(z.object({ id: eventIdSchema, data: eventSessionUpdateSchema }))
		.handler(async ({ context, input }) => {
			const repository = getRepository(context);
			const foundSession = await getEventSession(repository, input.id);
			if (!foundSession) {
				throw new ORPCError("NOT_FOUND");
			}
			const foundEvent = await getEvent(repository, foundSession.eventId);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertOrganizer(context, foundEvent.organizerId);
			return invoke(() =>
				updateEventSession(repository, foundEvent.id, input.id, input.data),
			);
		}),
	delete: protectedProcedure
		.input(z.object({ id: eventIdSchema }))
		.handler(async ({ context, input }) => {
			const repository = getRepository(context);
			const foundSession = await getEventSession(repository, input.id);
			if (!foundSession) {
				throw new ORPCError("NOT_FOUND");
			}
			const foundEvent = await getEvent(repository, foundSession.eventId);
			if (!foundEvent) {
				throw new ORPCError("NOT_FOUND");
			}
			assertOrganizer(context, foundEvent.organizerId);
			return invoke(() =>
				deleteEventSession(repository, foundEvent.id, input.id),
			);
		}),
};
