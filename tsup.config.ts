import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
	entry: ["src/main.ts"],
	sourcemap: true,
	clean: true,
	format: ["esm"],
	minify: false,
	dts: !!watch,
	onSuccess: watch ? "node --enable-source-maps dist/main" : undefined,
}));
