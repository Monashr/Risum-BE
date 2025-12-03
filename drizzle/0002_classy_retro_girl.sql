CREATE TABLE "materials_v2" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"picture_url" varchar(1000),
	"picture_name" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_materials" (
	"product_id" integer NOT NULL,
	"material_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_material_id_materials_v2_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials_v2"("id") ON DELETE no action ON UPDATE no action;