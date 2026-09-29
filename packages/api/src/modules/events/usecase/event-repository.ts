import type {
	CreateEvent,
	CreateEventSession,
	Event,
	EventSession,
	UpdateEvent,
	UpdateEventSession,
} from "../domain/events";

export interface EventRepository {
	transaction<T>(
		callback: (repository: EventRepository) => Promise<T>,
	): Promise<T>;
	createEvent(input: CreateEvent & { slug: string }): Promise<Event>;
	findEventById(id: string): Promise<Event | null>;
	findEventBySlug(slug: string): Promise<Event | null>;
	findPublishedEvents(): Promise<Event[]>;
	findEventsByOrganizerId(organizerId: string): Promise<Event[]>;
	updateEvent(id: string, input: UpdateEvent): Promise<Event | null>;
	deleteEvent(id: string): Promise<Event | null>;
	createEventSession(
		eventId: string,
		input: CreateEventSession,
	): Promise<EventSession>;
	findEventSessionById(id: string): Promise<EventSession | null>;
	findEventSessionsByEventId(eventId: string): Promise<EventSession[]>;
	updateEventSession(
		eventId: string,
		id: string,
		input: UpdateEventSession,
	): Promise<EventSession | null>;
	deleteEventSession(eventId: string, id: string): Promise<EventSession | null>;
}
