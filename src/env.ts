import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

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
	},
	runtimeEnv: process.env,
});
