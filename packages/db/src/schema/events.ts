import { sql } from "drizzle-orm";
import {
	check,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const eventStatus = pgEnum("event_status", [
	"draft",
	"published",
	"canceled",
]);
export const eventSessionStatus = pgEnum("event_session_status", [
	"scheduled",
	"canceled",
]);

export const event = pgTable(
	"event",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizerId: text("organizer_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		title: text("title").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description"),
		imageUrl: text("image_url"),
		status: eventStatus("status").default("draft").notNull(),
		timeZone: text("time_zone").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("event_organizer_id_idx").on(table.organizerId),
		index("event_status_idx").on(table.status),
		check("event_title_not_blank", sql`length(btrim(${table.title})) > 0`),
	],
);

export const eventSession = pgTable(
	"event_session",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => event.id, { onDelete: "cascade" }),
		name: text("name"),
		startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
		endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
		status: eventSessionStatus("status").default("scheduled").notNull(),
		venueName: text("venue_name"),
		venueAddress: text("venue_address"),
		onlineUrl: text("online_url"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("event_session_event_id_starts_at_idx").on(
			table.eventId,
			table.startsAt,
		),
		check("event_session_time_order", sql`${table.endsAt} > ${table.startsAt}`),
	],
);
