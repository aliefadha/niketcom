export const eventStatuses = ["draft", "published", "canceled"] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const eventSessionStatuses = ["scheduled", "canceled"] as const;
export type EventSessionStatus = (typeof eventSessionStatuses)[number];

export type Event = {
	id: string;
	organizerId: string;
	title: string;
	slug: string;
	description: string | null;
	imageUrl: string | null;
	status: EventStatus;
	timeZone: string;
	createdAt: Date;
	updatedAt: Date;
};

export type EventSession = {
	id: string;
	eventId: string;
	name: string | null;
	startsAt: Date;
	endsAt: Date;
	status: EventSessionStatus;
	venueName: string | null;
	venueAddress: string | null;
	onlineUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateEvent = {
	organizerId: string;
	title: string;
	slug?: string;
	description?: string | null;
	imageUrl?: string | null;
	status?: EventStatus;
	timeZone: string;
};

export type UpdateEvent = {
	title?: string;
	slug?: string;
	description?: string | null;
	imageUrl?: string | null;
	status?: EventStatus;
	timeZone?: string;
};

export type CreateEventSession = {
	name?: string | null;
	startsAt: Date;
	endsAt: Date;
	status?: EventSessionStatus;
	venueName?: string | null;
	venueAddress?: string | null;
	onlineUrl?: string | null;
};

export type UpdateEventSession = {
	name?: string | null;
	startsAt?: Date;
	endsAt?: Date;
	status?: EventSessionStatus;
	venueName?: string | null;
	venueAddress?: string | null;
	onlineUrl?: string | null;
};

export type EventSessionChanges = {
	create?: readonly CreateEventSession[];
	update?: readonly { id: string; data: UpdateEventSession }[];
	delete?: readonly string[];
};

export type EventAggregate = Event & {
	sessions: EventSession[];
};

export function toSlug(value: string) {
	const slug = value
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug || "event";
}

export function assertEventTitle(title: string) {
	if (title.trim().length === 0) {
		throw new InvalidEventTitleError();
	}
}

export function assertEventSessionTimeRange(startsAt: Date, endsAt: Date) {
	if (endsAt <= startsAt) {
		throw new InvalidEventSessionTimeRangeError();
	}
}

export class InvalidEventTitleError extends Error {
	constructor() {
		super("title must not be blank");
	}
}

export class EventSlugAlreadyExistsError extends Error {
	constructor() {
		super("slug is already in use");
	}
}

export class InvalidEventSessionTimeRangeError extends Error {
	constructor() {
		super("endsAt must be after startsAt");
	}
}
