ALTER TABLE "Guild" ALTER COLUMN "allowJoinRequests" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Primary" ALTER COLUMN "template" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Primary" ALTER COLUMN "generalName" DROP DEFAULT;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Alias" ADD CONSTRAINT "Alias_guildId_Guild_id_fk" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Primary" ADD CONSTRAINT "Primary_guildId_Guild_id_fk" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Secondary" ADD CONSTRAINT "Secondary_guildId_Guild_id_fk" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Secondary" ADD CONSTRAINT "Secondary_primaryId_Primary_id_fk" FOREIGN KEY ("primaryId") REFERENCES "public"."Primary"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
