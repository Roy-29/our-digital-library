ALTER TABLE `authors` ADD `is_illustrator` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `books` ADD `copies` integer DEFAULT 1;