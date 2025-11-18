CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PAYMENT_UPLOADED', 'PAYMENT_CONFIRMED', 'PAYMENT_REJECTED', 'PROCESS', 'COMPLETED', 'CANCELED');--> statement-breakpoint
CREATE TABLE "border_lengths" (
	"id" serial PRIMARY KEY NOT NULL,
	"max_length" integer NOT NULL,
	"cost_per_length" integer NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "colors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"minimum_order" integer,
	"special_color" boolean DEFAULT false,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "custom_columns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"picture_url" varchar(1000),
	"picture_name" varchar(255),
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'regular' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"size" boolean DEFAULT false,
	"size_image_name" varchar(500),
	"size_image_url" varchar(255),
	"material" boolean DEFAULT false,
	"variant" boolean DEFAULT false,
	"color" boolean DEFAULT false,
	"custom_column" boolean DEFAULT false,
	"can_add_border_length" boolean DEFAULT false,
	"can_add_text" boolean DEFAULT false,
	"can_add_logo" boolean DEFAULT false,
	"picture_url" varchar(1000),
	"picture_name" varchar(255),
	"category" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"picture_url" varchar(1000),
	"picture_name" varchar(255),
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"picture_url" varchar(1000),
	"picture_name" varchar(255),
	"addition_price" integer,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"full_name" varchar,
	"phone" varchar,
	"address" text,
	"payment_image_name" text,
	"payment_image_url" text,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" uuid,
	"product_id" integer,
	"size" varchar,
	"material" integer,
	"variant_id" integer,
	"color_id" integer,
	"custom_column_id" integer,
	"custom_column_answer" varchar,
	"text" varchar,
	"border_length_id" integer,
	"border_length_amount" integer,
	"logo_name" text,
	"logo_url" text,
	"design_name" text,
	"design_url" text,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"quantity" integer,
	"total_price" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"refresh_token" text,
	"expires_at" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "border_lengths" ADD CONSTRAINT "border_lengths_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colors" ADD CONSTRAINT "colors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_columns" ADD CONSTRAINT "custom_columns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_app_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_material_materials_id_fk" FOREIGN KEY ("material") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_color_id_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."colors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_custom_column_id_custom_columns_id_fk" FOREIGN KEY ("custom_column_id") REFERENCES "public"."custom_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_border_length_id_border_lengths_id_fk" FOREIGN KEY ("border_length_id") REFERENCES "public"."border_lengths"("id") ON DELETE cascade ON UPDATE no action;