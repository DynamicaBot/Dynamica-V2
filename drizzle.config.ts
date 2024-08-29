import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
	throw new Error("POSTGRES_URL is required");
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/features/drizzle/schema.ts",
	dbCredentials: {
		url: postgresUrl,
	},
});
