import type { Session } from "@niketcom/auth";
import type { Database } from "@niketcom/db";

export type Context = {
	session: Session | null;
	db: Database;
};
