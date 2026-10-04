ALTER TABLE `authors` ADD `is_author` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `authors` ADD `is_translator` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `books` ADD `illustrator_id` text REFERENCES authors(id);