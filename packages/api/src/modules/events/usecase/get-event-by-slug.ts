import type { EventAggregate } from "../domain/events";
import type { EventRepository } from "./event-repository";

export async function getEventBySlug(
	repository: EventRepository,
	slug: string,
): Promise<EventAggregate | null> {
	const event = await repository.findEventBySlug(slug);
	if (!event) {
		return null;
	}
	const sessions = await repository.findEventSessionsByEventId(event.id);
	return { ...event, sessions };
}
