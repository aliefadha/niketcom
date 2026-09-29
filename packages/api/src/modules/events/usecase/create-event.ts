import {
	assertEventSessionTimeRange,
	assertEventTitle,
	type CreateEvent,
	type CreateEventSession,
	type EventAggregate,
} from "../domain/events";
import type { EventRepository } from "./event-repository";
import { resolveEventSlug } from "./resolve-event-slug";

export type CreateEventInput = {
	event: CreateEvent;
	sessions?: readonly CreateEventSession[];
};

export function createEvent(
	repository: EventRepository,
	input: CreateEventInput,
) {
	return repository.transaction(async (transaction) => {
		assertEventTitle(input.event.title);
		for (const session of input.sessions ?? []) {
			assertEventSessionTimeRange(session.startsAt, session.endsAt);
		}

		const slug = await resolveEventSlug(transaction, input.event);
		const createdEvent = await transaction.createEvent({
			...input.event,
			slug,
		});
		const sessions = await Promise.all(
			(input.sessions ?? []).map((session) =>
				transaction.createEventSession(createdEvent.id, session),
			),
		);
		return { ...createdEvent, sessions } satisfies EventAggregate;
	});
}
