import type { EventRepository } from "./event-repository";

export function listPublishedEvents(repository: EventRepository) {
	return repository.findPublishedEvents();
}
