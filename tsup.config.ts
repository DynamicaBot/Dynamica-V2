import { defineConfig } from 'tsup';

export default defineConfig(({ watch }) => ({
  entry: ['src/main.ts', 'src/db/migrations'],
  splitting: true,
  sourcemap: true,
  clean: true,
  format: ['esm'],
  platform: 'node',
  minify: false,
  dts: false,
  bundle: true,
  metafile: true,
  loader: {
    '.graphql': 'text',
    '.sql': 'copy',
    '.json': 'copy',
  },
  onSuccess: watch ? 'node --enable-source-maps dist/main' : undefined,
}));
