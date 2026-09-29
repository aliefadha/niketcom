import {
	assertEventSessionTimeRange,
	type CreateEventSession,
	type EventSession,
} from "../domain/events";
import type { EventRepository } from "./event-repository";

export function createEventSession(
	repository: EventRepository,
	eventId: string,
	input: CreateEventSession,
): Promise<EventSession> {
	return repository.transaction((transaction) => {
		assertEventSessionTimeRange(input.startsAt, input.endsAt);
		return transaction.createEventSession(eventId, input);
	});
}
