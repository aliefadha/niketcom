import { createAuth } from "@niketcom/auth";
import { createDb } from "@niketcom/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
