import type { EventAggregate } from "../domain/events";
import type { EventRepository } from "./event-repository";

export async function getEvent(
	repository: EventRepository,
	id: string,
): Promise<EventAggregate | null> {
	const event = await repository.findEventById(id);
	if (!event) {
		return null;
	}
	const sessions = await repository.findEventSessionsByEventId(event.id);
	return { ...event, sessions };
}
