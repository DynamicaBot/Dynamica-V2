import { HttpAdapterHost, NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { DiscordExceptionFilter } from "./filters/DiscordFilter";
import { SentryFilter } from "./filters/SentryFilter";
import { rewriteFramesIntegration } from "@sentry/node";
import { env } from "./env";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	if (env.SENTRY_DSN) {
		const sentry = await import("@sentry/node");
		// const rootEsmFile = fileURLToPath(import.meta.url);
		// const rootEsmDir = path.dirname(rootEsmFile);
		Error.stackTraceLimit = Number.POSITIVE_INFINITY;
		sentry.init({
			dsn: env.SENTRY_DSN,
			release: env.VERSION,
			integrations: [
				rewriteFramesIntegration({
					prefix: "/",
				}),
			],
		});
	}

	app.enableCors({
		origin: "*",
	});

	const { httpAdapter } = app.get(HttpAdapterHost);

	app.useGlobalFilters(
		new SentryFilter(httpAdapter),
		new DiscordExceptionFilter(),
	);
	await app.listen(3000);
}
bootstrap();
