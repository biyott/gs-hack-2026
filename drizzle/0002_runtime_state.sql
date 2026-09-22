CREATE TABLE `run_runtime_state` (
	`run_id` text NOT NULL,
	`version` integer NOT NULL,
	`payload_json` text NOT NULL,
	PRIMARY KEY(`run_id`, `version`),
	FOREIGN KEY (`run_id`,`version`) REFERENCES `run_snapshots`(`run_id`,`version`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TRIGGER runtime_state_immutable_update BEFORE UPDATE ON run_runtime_state BEGIN SELECT RAISE(ABORT, 'immutable runtime state'); END;
--> statement-breakpoint
CREATE TRIGGER runtime_state_immutable_delete BEFORE DELETE ON run_runtime_state BEGIN SELECT RAISE(ABORT, 'immutable runtime state'); END;
