import {
	assertEventSessionTimeRange,
	assertEventTitle,
	type EventAggregate,
	type EventSessionChanges,
	type UpdateEvent as UpdateEventData,
} from "../domain/events";
import { EntityNotFoundError } from "./errors";
import type { EventRepository } from "./event-repository";
import { resolveEventSlug } from "./resolve-event-slug";

export type UpdateEventInput = {
	id: string;
	event?: UpdateEventData;
	sessions?: EventSessionChanges;
};

export function updateEvent(
	repository: EventRepository,
	input: UpdateEventInput,
) {
	return repository.transaction(async (transaction) => {
		if (input.event?.title !== undefined) {
			assertEventTitle(input.event.title);
		}

		const eventUpdate =
			input.event?.slug === undefined
				? input.event
				: {
						...input.event,
						slug: await resolveEventSlug(transaction, input.event, input.id),
					};
		const updatedEvent = eventUpdate
			? await transaction.updateEvent(input.id, eventUpdate)
			: await transaction.findEventById(input.id);
		if (!updatedEvent) {
			throw new EntityNotFoundError("event");
		}

		const currentSessions = await transaction.findEventSessionsByEventId(
			updatedEvent.id,
		);
		for (const session of input.sessions?.create ?? []) {
			assertEventSessionTimeRange(session.startsAt, session.endsAt);
			await transaction.createEventSession(updatedEvent.id, session);
		}
		for (const session of input.sessions?.update ?? []) {
			const currentSession = currentSessions.find(
				(candidate) => candidate.id === session.id,
			);
			if (!currentSession) {
				throw new EntityNotFoundError("event session");
			}
			assertEventSessionTimeRange(
				session.data.startsAt ?? currentSession.startsAt,
				session.data.endsAt ?? currentSession.endsAt,
			);
			const updatedSession = await transaction.updateEventSession(
				updatedEvent.id,
				session.id,
				session.data,
			);
			if (!updatedSession) {
				throw new EntityNotFoundError("event session");
			}
		}
		for (const sessionId of input.sessions?.delete ?? []) {
			const deletedSession = await transaction.deleteEventSession(
				updatedEvent.id,
				sessionId,
			);
			if (!deletedSession) {
				throw new EntityNotFoundError("event session");
			}
		}

		const sessions = await transaction.findEventSessionsByEventId(
			updatedEvent.id,
		);
		return { ...updatedEvent, sessions } satisfies EventAggregate;
	});
}
