import esbuild from 'esbuild'
import { copy } from 'esbuild-plugin-copy'
import { sassPlugin } from 'esbuild-sass-plugin'
import { handleBuildDone } from './lib.js'
const DEV = !!process.env.NODE_ENV?.match(/dev/i)
const WATCH = !!process.argv.includes('-w')

const buildOpts = {
  entryPoints: ['src/index.ts'],
  target: ['esnext'],
  bundle: true,
  logLevel: 'silent',
  minify: !DEV,
  format: 'esm',
  plugins: [
    copy({
      resolveFrom: 'cwd',
      assets: { from: ['./src/index.html'], to: ['./dist/index.html'] }
    }),
    sassPlugin({ type: 'style', style: 'compressed' })
  ],
  outdir: 'dist',
  sourcemap: DEV ? 'inline' : false,
  ...(DEV ? {} : { mangleProps: /_$/ })
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
