ALTER TABLE "order_details" DROP CONSTRAINT "order_details_material_materials_id_fk";
--> statement-breakpoint
ALTER TABLE "order_details" DROP CONSTRAINT "order_details_color_id_colors_id_fk";
--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_material_materials_v2_id_fk" FOREIGN KEY ("material") REFERENCES "public"."materials_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_color_id_colors_v2_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."colors_v2"("id") ON DELETE cascade ON UPDATE no action;