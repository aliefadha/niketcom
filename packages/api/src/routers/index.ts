import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import {
	eventSessionsRouter,
	eventsRouter,
} from "../modules/events/presentation/router";

export const appRouter = {
	events: eventsRouter,
	eventSessions: eventSessionsRouter,
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
