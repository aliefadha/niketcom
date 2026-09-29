import type { Event } from "../domain/events";
import { EntityNotFoundError } from "./errors";
import type { EventRepository } from "./event-repository";

export async function deleteEvent(
	repository: EventRepository,
	id: string,
): Promise<Event> {
	return repository.transaction(async (transaction) => {
		const deletedEvent = await transaction.deleteEvent(id);
		if (!deletedEvent) {
			throw new EntityNotFoundError("event");
		}
		return deletedEvent;
	});
}
