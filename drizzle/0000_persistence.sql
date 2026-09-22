CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`worker_id` text,
	`device_role` text,
	`pin_hash` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`auth_version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `active_runs` (
	`mode` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `run_heads`(`run_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `guidance_versions` (
	`guidance_id` text NOT NULL,
	`version` integer NOT NULL,
	`run_id` text NOT NULL,
	`incident_id` text NOT NULL,
	`worker_id` text NOT NULL,
	`created_at` text NOT NULL,
	`payload_json` text NOT NULL,
	PRIMARY KEY(`guidance_id`, `version`),
	FOREIGN KEY (`run_id`) REFERENCES `run_heads`(`run_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `guidance_incident_idx` ON `guidance_versions` (`incident_id`,`worker_id`,`version`);--> statement-breakpoint
CREATE TABLE `incident_audit` (
	`event_id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`incident_id` text,
	`actor_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`payload_json` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `run_heads`(`run_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_run_idx` ON `incident_audit` (`run_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `request_receipts` (
	`mode` text NOT NULL,
	`run_id` text NOT NULL,
	`request_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`payload_json` text NOT NULL,
	`snapshot_json` text NOT NULL,
	PRIMARY KEY(`mode`, `run_id`, `request_id`),
	FOREIGN KEY (`run_id`) REFERENCES `run_heads`(`run_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `response_receipts` (
	`run_id` text NOT NULL,
	`worker_id` text NOT NULL,
	`request_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`payload_json` text NOT NULL,
	`snapshot_json` text NOT NULL,
	PRIMARY KEY(`run_id`, `worker_id`, `request_id`),
	FOREIGN KEY (`run_id`) REFERENCES `run_heads`(`run_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `run_heads` (
	`run_id` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`version` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `run_snapshots` (
	`run_id` text NOT NULL,
	`version` integer NOT NULL,
	`actor_id` text NOT NULL,
	`created_at` text NOT NULL,
	`payload_json` text NOT NULL,
	PRIMARY KEY(`run_id`, `version`),
	FOREIGN KEY (`run_id`) REFERENCES `run_heads`(`run_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`account_id` text NOT NULL,
	`auth_version` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_account_idx` ON `sessions` (`account_id`);
--> statement-breakpoint
CREATE TRIGGER guidance_immutable_update BEFORE UPDATE ON guidance_versions BEGIN SELECT RAISE(ABORT, 'immutable guidance'); END;
--> statement-breakpoint
CREATE TRIGGER guidance_immutable_delete BEFORE DELETE ON guidance_versions BEGIN SELECT RAISE(ABORT, 'immutable guidance'); END;
--> statement-breakpoint
CREATE TRIGGER snapshots_immutable_update BEFORE UPDATE ON run_snapshots BEGIN SELECT RAISE(ABORT, 'immutable snapshot'); END;
--> statement-breakpoint
CREATE TRIGGER snapshots_immutable_delete BEFORE DELETE ON run_snapshots BEGIN SELECT RAISE(ABORT, 'immutable snapshot'); END;
--> statement-breakpoint
CREATE TRIGGER audit_immutable_update BEFORE UPDATE ON incident_audit BEGIN SELECT RAISE(ABORT, 'immutable audit'); END;
--> statement-breakpoint
CREATE TRIGGER audit_immutable_delete BEFORE DELETE ON incident_audit BEGIN SELECT RAISE(ABORT, 'immutable audit'); END;
--> statement-breakpoint
CREATE TRIGGER response_immutable_update BEFORE UPDATE ON response_receipts BEGIN SELECT RAISE(ABORT, 'immutable response'); END;
--> statement-breakpoint
CREATE TRIGGER response_immutable_delete BEFORE DELETE ON response_receipts BEGIN SELECT RAISE(ABORT, 'immutable response'); END;
--> statement-breakpoint
CREATE TRIGGER requests_immutable_update BEFORE UPDATE ON request_receipts BEGIN SELECT RAISE(ABORT, 'immutable request'); END;
--> statement-breakpoint
CREATE TRIGGER requests_immutable_delete BEFORE DELETE ON request_receipts BEGIN SELECT RAISE(ABORT, 'immutable request'); END;
