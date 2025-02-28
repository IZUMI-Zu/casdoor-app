CREATE TABLE `passwords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`application` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`signin_url` text DEFAULT 'null',
	`deleted_at` integer DEFAULT 'null',
	`changed_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`sync_at` integer DEFAULT 'null',
	`origin` text DEFAULT 'null'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passwords_application_username_signin_url_unique` ON `passwords` (`application`,`username`,`signin_url`);