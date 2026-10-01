CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`entity_name` text,
	`details` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `authors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_bn` text,
	`bio` text,
	`birth_year` integer,
	`death_year` integer,
	`nationality` text,
	`image_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`title_original` text,
	`subtitle` text,
	`isbn` text,
	`language` text DEFAULT 'বাংলা',
	`edition` text,
	`publication_year` integer,
	`page_count` integer,
	`description` text,
	`cover_url` text,
	`author_id` text,
	`translator_id` text,
	`publisher_id` text,
	`category_id` text,
	`genre_id` text,
	`owner` text DEFAULT 'swapnil' NOT NULL,
	`room_id` text,
	`shelf_id` text,
	`rack_id` text,
	`rack_row` integer,
	`rack_position` integer,
	`status` text DEFAULT 'আছে' NOT NULL,
	`is_purchased` integer DEFAULT true,
	`purchase_date` text,
	`purchase_source` text,
	`purchase_price` real,
	`purchase_discount` real DEFAULT 0,
	`purchase_final_price` real,
	`purchased_by` text,
	`book_condition` text DEFAULT 'new',
	`reading_start_date` text,
	`reading_finish_date` text,
	`reading_progress` integer DEFAULT 0,
	`rating` real,
	`review` text,
	`notes` text,
	`favorite_quote` text,
	`is_favorite` integer DEFAULT false,
	`added_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`translator_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`publisher_id`) REFERENCES `publishers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`shelf_id`) REFERENCES `shelves`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`rack_id`) REFERENCES `racks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`added_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `borrowers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`notes` text,
	`image_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_bn` text,
	`description` text,
	`color` text DEFAULT '#6B7280',
	`icon` text DEFAULT '📁',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `genres` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_bn` text,
	`description` text,
	`color` text DEFAULT '#6B7280',
	`icon` text DEFAULT '🏷️',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `genres_name_unique` ON `genres` (`name`);--> statement-breakpoint
CREATE TABLE `lending_records` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`borrower_id` text NOT NULL,
	`lent_by` text NOT NULL,
	`date_lent` text NOT NULL,
	`expected_return_date` text,
	`date_returned` text,
	`is_returned` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`borrower_id`) REFERENCES `borrowers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `publishers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_bn` text,
	`address` text,
	`website` text,
	`phone` text,
	`email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `racks` (
	`id` text PRIMARY KEY NOT NULL,
	`shelf_id` text NOT NULL,
	`name` text NOT NULL,
	`name_bn` text,
	`position_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`shelf_id`) REFERENCES `shelves`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_bn` text,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `shelves` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`name` text NOT NULL,
	`name_bn` text,
	`description` text,
	`capacity` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `wishlist` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author_name` text,
	`author_id` text,
	`publisher_name` text,
	`isbn` text,
	`estimated_price` real,
	`priority` text DEFAULT 'medium',
	`source` text,
	`notes` text,
	`requested_by` text DEFAULT 'swapnil' NOT NULL,
	`is_purchased` integer DEFAULT false NOT NULL,
	`purchased_book_id` text,
	`purchased_date` text,
	`cover_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`purchased_book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE set null
);
