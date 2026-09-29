import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	user: {
		sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
		accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
		events: r.many.event({ from: r.user.id, to: r.event.organizerId }),
	},
	session: {
		user: r.one.user({ from: r.session.userId, to: r.user.id }),
	},
	account: {
		user: r.one.user({ from: r.account.userId, to: r.user.id }),
	},
	event: {
		organizer: r.one.user({ from: r.event.organizerId, to: r.user.id }),
		sessions: r.many.eventSession({
			from: r.event.id,
			to: r.eventSession.eventId,
		}),
	},
	eventSession: {
		event: r.one.event({ from: r.eventSession.eventId, to: r.event.id }),
	},
}));
