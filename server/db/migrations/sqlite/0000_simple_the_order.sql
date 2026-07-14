CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`lang` text DEFAULT 'en',
	`roles` text DEFAULT '["user"]' NOT NULL,
	`limits` text DEFAULT 'free',
	`validated` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_user_unique` ON `accounts` (`user`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_unique` ON `accounts` (`email`);--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`subject` text,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`text` text,
	`html` text,
	`date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emails_message_id_unique` ON `emails` (`message_id`);--> statement-breakpoint
CREATE TABLE `notification_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`is_default` integer DEFAULT 0,
	`type` text NOT NULL,
	`config` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `report_items` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`email_id` text NOT NULL,
	`spec_id` text NOT NULL,
	`text` text NOT NULL,
	`sent_report_item` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `report_specs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`dow` text DEFAULT '[false,false,false,false,false,false,false]' NOT NULL,
	`desc` text,
	`lang` text DEFAULT 'en',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tags` text DEFAULT '["user.all"]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);