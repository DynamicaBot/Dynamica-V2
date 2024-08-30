import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

export const env = createEnv({
	server: {
		/** Database URL */
		POSTGRES_URL: z.string().url(),

		/** Discord Bot Token */
		TOKEN: z.string(),

		/** Sentry DSN */
		SENTRY_DSN: z.string().optional(),

		/** The URL of the MQTT broker */
		MQTT_URL: z.string().url().optional(),
		/** The username to use when connecting to the MQTT broker */
		MQTT_USER: z.string().optional(),
		/** The password to use when connecting to the MQTT broker */
		MQTT_PASSWORD: z.string().optional(),

		/** Version */
		VERSION: z.string().optional(),
		/** The node env */
		NODE_ENV: z.enum(["development", "production"]).default("development"),
	},
	runtimeEnvStrict: {
		MQTT_PASSWORD: process.env.MQTT_PASSWORD,
		MQTT_USER: process.env.MQTT_USER,
		MQTT_URL: process.env.MQTT_URL,
		POSTGRES_URL: process.env.POSTGRES_URL,
		TOKEN: process.env.TOKEN,
		SENTRY_DSN: process.env.SENTRY_DSN,
		VERSION: process.env.VERSION,
		NODE_ENV: process.env.NODE_ENV,
	},
	emptyStringAsUndefined: true,
});
