import type { EventSession } from "../domain/events";
import { EntityNotFoundError } from "./errors";
import type { EventRepository } from "./event-repository";

export async function deleteEventSession(
	repository: EventRepository,
	eventId: string,
	id: string,
): Promise<EventSession> {
	return repository.transaction(async (transaction) => {
		const deletedSession = await transaction.deleteEventSession(eventId, id);
		if (!deletedSession) {
			throw new EntityNotFoundError("event session");
		}
		return deletedSession;
	});
}
