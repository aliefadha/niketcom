import { EventSlugAlreadyExistsError, toSlug } from "../domain/events";
import type { EventRepository } from "./event-repository";

export async function resolveEventSlug(
	repository: EventRepository,
	input: { title?: string; slug?: string },
	excludeEventId?: string,
) {
	const requestedSlug = input.slug ? toSlug(input.slug) : undefined;
	if (requestedSlug) {
		const existingEvent = await repository.findEventBySlug(requestedSlug);
		if (existingEvent && existingEvent.id !== excludeEventId) {
			throw new EventSlugAlreadyExistsError();
		}
		return requestedSlug;
	}

	const baseSlug = toSlug(input.title ?? "event");
	for (let suffix = 1; ; suffix += 1) {
		const slug = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
		const existingEvent = await repository.findEventBySlug(slug);
		if (!existingEvent || existingEvent.id === excludeEventId) {
			return slug;
		}
	}
}
