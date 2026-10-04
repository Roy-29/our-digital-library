CREATE TABLE `magazines` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`issue_month` text,
	`issue_year` integer,
	`volume` text,
	`publisher_id` text,
	`cover_url` text,
	`page_count` integer,
	`owner` text DEFAULT 'swapnil' NOT NULL,
	`status` text DEFAULT 'আছে' NOT NULL,
	`reading_status` text,
	`reading_progress` integer DEFAULT 0,
	`added_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`publisher_id`) REFERENCES `publishers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`added_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
