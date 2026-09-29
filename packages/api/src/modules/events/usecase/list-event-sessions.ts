import type { EventRepository } from "./event-repository";

export function listEventSessions(
	repository: EventRepository,
	eventId: string,
) {
	return repository.findEventSessionsByEventId(eventId);
}
