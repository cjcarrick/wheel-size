import esbuild from 'esbuild'
import { handleBuildDone } from './lib.js'
import { sassPlugin } from 'esbuild-sass-plugin'
const DEV = !!process.env.NODE_ENV?.match(/dev/i)
const WATCH = !!process.argv.includes('-w')

const buildOpts = {
  entryPoints: ['src/index.ts'],
  target: ['esnext'],
  bundle: true,
  logLevel: 'silent',
  minify: !DEV,
  format: 'esm',
  plugins: [sassPlugin({ type: 'style', style: 'compressed' })],
  outdir: 'dist',
  sourcemap: 'inline'
}

if (WATCH) {
  const ctx = await esbuild.context({
    ...buildOpts,
    plugins: [
      ...(buildOpts.plugins || []),
      {
        name: 'Watcher Logger',
        setup: build => {
          build.onEnd(handleBuildDone)
        }
      }
    ]
  })
  await ctx.watch()
} else {
  esbuild.build(buildOpts).then(handleBuildDone).catch(handleBuildDone)
}
