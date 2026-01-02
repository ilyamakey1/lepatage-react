CREATE TABLE `custom_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`preferred_contact` text,
	`social_link` text,
	`bust` text,
	`waist` text,
	`hips` text,
	`send_measurements_later` integer DEFAULT false,
	`photos` text,
	`figure_comments` text,
	`metal_type` text,
	`initials` text,
	`country` text,
	`city` text,
	`postal_code` text,
	`address` text,
	`delivery_method` text,
	`desired_date` text,
	`need_online_measurements` integer DEFAULT false,
	`status` text DEFAULT 'new' NOT NULL,
	`admin_notes` text,
	`estimated_price` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE orders ADD `currency` text DEFAULT 'BYN' NOT NULL;--> statement-breakpoint
ALTER TABLE orders ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE orders ADD `payment_id` text;--> statement-breakpoint
ALTER TABLE orders ADD `payment_data` text;--> statement-breakpoint
CREATE UNIQUE INDEX `custom_orders_order_number_unique` ON `custom_orders` (`order_number`);