import type { EventRepository } from "./event-repository";

export function listOrganizerEvents(
	repository: EventRepository,
	organizerId: string,
) {
	return repository.findEventsByOrganizerId(organizerId);
}
