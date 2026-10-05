CREATE TABLE `magazine_issues` (
	`id` text PRIMARY KEY NOT NULL,
	`magazine_id` text NOT NULL,
	`issue_month` text,
	`issue_year` integer,
	`volume` text,
	`copies` integer DEFAULT 1,
	`status` text DEFAULT 'আছে' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`magazine_id`) REFERENCES `magazines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `magazines` DROP COLUMN `issue_month`;--> statement-breakpoint
ALTER TABLE `magazines` DROP COLUMN `issue_year`;--> statement-breakpoint
ALTER TABLE `magazines` DROP COLUMN `volume`;--> statement-breakpoint
ALTER TABLE `magazines` DROP COLUMN `page_count`;--> statement-breakpoint
ALTER TABLE `magazines` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `magazines` DROP COLUMN `reading_status`;--> statement-breakpoint
ALTER TABLE `magazines` DROP COLUMN `reading_progress`;