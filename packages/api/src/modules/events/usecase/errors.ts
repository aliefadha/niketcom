export class EntityNotFoundError extends Error {
	constructor(entity: "event" | "event session") {
		super(`${entity} not found`);
	}
}
