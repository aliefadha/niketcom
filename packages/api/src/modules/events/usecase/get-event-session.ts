import type { EventRepository } from "./event-repository";

export function getEventSession(repository: EventRepository, id: string) {
	return repository.findEventSessionById(id);
}
