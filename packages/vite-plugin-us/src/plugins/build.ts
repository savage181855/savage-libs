import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

import type { UserConfig, PluginOption, ResolvedConfig } from 'vite'
import { OutputChunk } from 'rollup'

import { grants } from '../types/userscript'
import { generateHeadMeta } from '../utils/generateMetadata'
import {
	resourcePath,
	inlineSvg,
	removeSvg,
	injectExternalCssLink,
	addPrefixForName
} from '../utils/utils'
import type { Grants } from '../types/userscript'
import type { ResourceRecord, UsOptions } from '../types/types'

export function build(usOptions: Required<UsOptions>) {
	let resovledConfig: ResolvedConfig
	let cssUrls: string[]

	return {
		name: 'vite-plugin-us:build',
		enforce: 'post',
		apply: 'build',
		config() {
			let resource = {} as ResourceRecord

			try {
				resource = JSON.parse(readFileSync(resourcePath, { encoding: 'utf-8' }))
			} catch {}

			cssUrls = resource?.categoryRecord?.css.map(v => v.url) || []
			const jsUrls = resource?.categoryRecord?.js.map(v => v.url) || []

			const r = usOptions.headMetaData.require
			usOptions.headMetaData.require = r?.concat(jsUrls)

			return {
				build: {
					assetsInlineLimit: Number.MAX_SAFE_INTEGER,
					chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
					assetsDir: './',
					target: 'esnext',
					minify: usOptions.build.minify,
					cssMinify: usOptions.build.cssMinify,
					rollupOptions: {
						input: usOptions.entry,
						external: resource.externals,
						output: {
							extend: true,
							format: 'iife',
							globals: resource.globalVariableNameRecord
						}
					}
				}
			} as UserConfig
		},
		load(id) {
			preventCssDep()
			function preventCssDep() {
				if (/node_modules/.test(id) && /css$/.test(id)) return ''
			}
		},
		async configResolved(config) {
			resovledConfig = config
		},
		async transform(code, id) {
			return inlineSvg(resovledConfig, code, id)
		},
		generateBundle(options, bundle) {
			return removeSvg(bundle)
		},
		writeBundle(options, bundle) {
			const key = Object.keys(bundle)[0]
			const mainBundle = bundle[key] as OutputChunk
			const code = usOptions?.generate?.bundle?.(mainBundle.code) as string

			const regex = new RegExp(grants.join('|').replace('|$', ''), 'g')
			const matchRes = [...code.matchAll(regex)]
			const collectedGrant = matchRes.map(v => v[0])

			if (usOptions.autoAddGrant) {
				usOptions.headMetaData.grant = collectedGrant as Grants[]
			}

			addPrefixForName(usOptions, 'production')

			const metaData = usOptions?.generate?.headMetaData?.(
				generateHeadMeta(usOptions.headMetaData),
				'production'
			) as string

			const fullCodeList: string[] = []

			fullCodeList.push(injectExternalCssLink(cssUrls))

			fullCodeList.unshift(metaData)
			fullCodeList.push(code)

			const path = resolve(
				options.dir as string,
				`${usOptions.headMetaData.name?.replaceAll(
					/production|:|\s/g,
					''
				)}.user.js`
			)

			writeFileSync(path, fullCodeList.join('\n'))
			unlinkSync(resolve(options.dir as string, key))
		}
	} as PluginOption
}
