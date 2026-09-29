import {
	assertEventSessionTimeRange,
	type EventSession,
	type UpdateEventSession as UpdateEventSessionData,
} from "../domain/events";
import { EntityNotFoundError } from "./errors";
import type { EventRepository } from "./event-repository";

export async function updateEventSession(
	repository: EventRepository,
	eventId: string,
	id: string,
	input: UpdateEventSessionData,
): Promise<EventSession> {
	return repository.transaction(async (transaction) => {
		const currentSession = await transaction.findEventSessionById(id);
		if (!currentSession || currentSession.eventId !== eventId) {
			throw new EntityNotFoundError("event session");
		}
		assertEventSessionTimeRange(
			input.startsAt ?? currentSession.startsAt,
			input.endsAt ?? currentSession.endsAt,
		);

		const updatedSession = await transaction.updateEventSession(
			eventId,
			id,
			input,
		);
		if (!updatedSession) {
			throw new EntityNotFoundError("event session");
		}
		return updatedSession;
	});
}
