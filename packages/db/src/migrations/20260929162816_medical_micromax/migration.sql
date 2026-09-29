ALTER TABLE "event" ADD COLUMN "slug" text;--> statement-breakpoint
WITH normalized_events AS (
	SELECT
		"id",
		COALESCE(
			NULLIF(
				TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("title"), '[^a-z0-9]+', '-', 'g')),
				''
			),
			'event'
		) AS "base_slug"
	FROM "event"
), numbered_events AS (
	SELECT
		"id",
		"base_slug",
		ROW_NUMBER() OVER (PARTITION BY "base_slug" ORDER BY "id") AS "suffix"
	FROM normalized_events
)
UPDATE "event"
SET "slug" = numbered_events."base_slug" || CASE
	WHEN numbered_events."suffix" = 1 THEN ''
	ELSE '-' || numbered_events."suffix"
END
FROM numbered_events
WHERE "event"."id" = numbered_events."id";--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_slug_key" UNIQUE("slug");