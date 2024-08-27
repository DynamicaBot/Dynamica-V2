CREATE TABLE IF NOT EXISTS "Alias" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity" text NOT NULL,
	"alias" text NOT NULL,
	"guildId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Guild" (
	"id" text PRIMARY KEY NOT NULL,
	"allowJoinRequests" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Migrated" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Primary" (
	"id" text PRIMARY KEY NOT NULL,
	"creator" text NOT NULL,
	"template" text DEFAULT '@@game@@ ##' NOT NULL,
	"generalName" text DEFAULT 'General ##' NOT NULL,
	"guildId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Secondary" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"creator" text,
	"emoji" text,
	"locked" boolean DEFAULT false NOT NULL,
	"guildId" text NOT NULL,
	"primaryId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastName" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Alias" ADD CONSTRAINT "Alias_guild_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Primary" ADD CONSTRAINT "Primary_guild_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Secondary" ADD CONSTRAINT "Secondary_guild_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Secondary" ADD CONSTRAINT "Secondary_primary_fkey" FOREIGN KEY ("primaryId") REFERENCES "public"."Primary"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Alias_guildId_activity_key" ON "Alias" USING btree ("guildId","activity");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Primary_guildId_id_key" ON "Primary" USING btree ("guildId","id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Secondary_guildId_id_key" ON "Secondary" USING btree ("guildId","id");