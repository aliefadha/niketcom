import type { Database } from "@niketcom/db";
import { event, eventSession } from "@niketcom/db/schema/events";
import { and, eq } from "drizzle-orm";

import type {
	CreateEvent,
	CreateEventSession,
	UpdateEvent,
	UpdateEventSession,
} from "../domain/events";
import type { EventRepository } from "../usecase/event-repository";

type QueryExecutor = Pick<Database, "delete" | "insert" | "select" | "update">;

export function createDrizzleEventRepository(db: Database): EventRepository {
	const repository = createRepository(db);

	return {
		...repository,
		transaction: (callback) =>
			db.transaction((transaction) => callback(createRepository(transaction))),
	};
}

function createRepository(db: QueryExecutor): EventRepository {
	const repository: EventRepository = {
		transaction: (callback) => callback(repository),
		createEvent: async (input: CreateEvent & { slug: string }) => {
			const [createdEvent] = await db.insert(event).values(input).returning();
			if (!createdEvent) {
				throw new Error("Failed to create event");
			}
			return createdEvent;
		},
		findEventById: async (id: string) => {
			const [foundEvent] = await db
				.select()
				.from(event)
				.where(eq(event.id, id))
				.limit(1);
			return foundEvent ?? null;
		},
		findEventBySlug: async (slug: string) => {
			const [foundEvent] = await db
				.select()
				.from(event)
				.where(eq(event.slug, slug))
				.limit(1);
			return foundEvent ?? null;
		},
		findPublishedEvents: () =>
			db.select().from(event).where(eq(event.status, "published")),
		findEventsByOrganizerId: (organizerId: string) =>
			db.select().from(event).where(eq(event.organizerId, organizerId)),
		updateEvent: async (id: string, input: UpdateEvent) => {
			const [updatedEvent] = await db
				.update(event)
				.set(input)
				.where(eq(event.id, id))
				.returning();
			return updatedEvent ?? null;
		},
		deleteEvent: async (id: string) => {
			const [deletedEvent] = await db
				.delete(event)
				.where(eq(event.id, id))
				.returning();
			return deletedEvent ?? null;
		},
		createEventSession: async (eventId: string, input: CreateEventSession) => {
			const [createdSession] = await db
				.insert(eventSession)
				.values({ ...input, eventId })
				.returning();
			if (!createdSession) {
				throw new Error("Failed to create event session");
			}
			return createdSession;
		},
		findEventSessionById: async (id: string) => {
			const [foundSession] = await db
				.select()
				.from(eventSession)
				.where(eq(eventSession.id, id))
				.limit(1);
			return foundSession ?? null;
		},
		findEventSessionsByEventId: (eventId: string) =>
			db.select().from(eventSession).where(eq(eventSession.eventId, eventId)),
		updateEventSession: async (
			eventId: string,
			id: string,
			input: UpdateEventSession,
		) => {
			const [updatedSession] = await db
				.update(eventSession)
				.set(input)
				.where(and(eq(eventSession.id, id), eq(eventSession.eventId, eventId)))
				.returning();
			return updatedSession ?? null;
		},
		deleteEventSession: async (eventId: string, id: string) => {
			const [deletedSession] = await db
				.delete(eventSession)
				.where(and(eq(eventSession.id, id), eq(eventSession.eventId, eventId)))
				.returning();
			return deletedSession ?? null;
		},
	};

	return repository;
}
