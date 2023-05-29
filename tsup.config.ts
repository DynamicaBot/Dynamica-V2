import { defineConfig } from 'tsup';

export default defineConfig(({ watch }) => ({
  entry: ['src/main.ts'],
  splitting: true,
  sourcemap: true,
  clean: true,
  format: ['esm'],
  platform: 'node',
  minify: false,
  dts: true,
  bundle: true,
  metafile: true,
  loader: {
    '.graphql': 'text',
  },
  onSuccess: watch ? 'node --enable-source-maps dist/main' : undefined,
}));
