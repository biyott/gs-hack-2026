CREATE TABLE `measurement_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`source_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`observed_at` text NOT NULL,
	`received_at` text NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `measurement_identity_unique` ON `measurement_events` (`kind`,`source_id`,`sequence`,`observed_at`);--> statement-breakpoint
CREATE INDEX `measurement_kind_id_idx` ON `measurement_events` (`kind`,`id`);--> statement-breakpoint
CREATE INDEX `measurement_source_id_idx` ON `measurement_events` (`kind`,`source_id`,`id`);
--> statement-breakpoint
CREATE TRIGGER measurement_events_immutable_update BEFORE UPDATE ON measurement_events BEGIN SELECT RAISE(ABORT, 'immutable measurement event'); END;
--> statement-breakpoint
CREATE TRIGGER measurement_events_immutable_delete BEFORE DELETE ON measurement_events BEGIN SELECT RAISE(ABORT, 'immutable measurement event'); END;
