import { extname } from 'node:path'
import { writeFile } from 'node:fs/promises'

import { debounce, merge } from 'lodash-es'

import type { ResourceRecord, PkgDepsRecord, DepRecord } from '../types/types'

import { resourcePath, pkg } from './utils'
import { getDepsRecords } from '../cdn/cdn'

export class DepCollection {
	private regExclusion: RegExp
	private manuallyDeps: string[]

	private collectDeps: string[] = []

	private readonly resource = {
		globalVariableNameRecord: {},
		externals: [],
		categoryRecord: {}
	} as ResourceRecord

	private readonly pkgDeps = Object.keys(pkg.dependencies ?? {})
	private readonly regPkgDep = new RegExp(
		this.pkgDeps.join('|').replace(/|$/, '')
	)

	constructor(exclusions: string[], manuallyDeps: string[]) {
		this.regExclusion = new RegExp(exclusions.join('|').replace(/|$/, ''))
		this.manuallyDeps = manuallyDeps
	}

	private pushDep(id: string) {
		const isNotCollect = this.collectDeps.every(v => v !== id)
		if (isNotCollect) this.collectDeps.push(id)
	}

	public collectCssDep(id: string) {
		if (/node_modules/.test(id) && /css$/.test(id)) {
			this.pushDep(id)
			return null
		}
	}

	public collectDep(code: string, id: string) {
		const isLocal = !/node_modules/.test(id)
		const isFile = !!extname(id)
		const isOriginalFile = id.split('?').length === 1

		if (!isLocal || !isFile || !isOriginalFile) return false

		const regPkg = /import[\s\d\w{},]+(?<quote>'|")(?<path>[^.].+?)\k<quote>/g

		const matchAllResult = [...code.matchAll(regPkg)]

		matchAllResult.forEach(v => {
			const importPath = v.groups?.path as string

			const isInPkg = this.regPkgDep.test(importPath)
			const isNotExclude = !this.regExclusion.test(importPath)
			const isCssFile = extname(importPath) === '.css'
			const isJsFile = extname(importPath) === ''
			const isNotManualy = !this.manuallyDeps.includes(importPath)

			if (isInPkg) {
				if (isCssFile || (isJsFile && isNotExclude && isNotManualy)) {
					return this.pushDep(importPath)
				}
			}
		})
	}

	private removeNodeModulesFromPath() {
		return [...this.collectDeps].map(v => {
			const splitArr = v.split('node_modules')
			v = (splitArr.pop() as string).replace(/^\//, '')
			return v
		})
	}

	private getExternals(depsRecords: DepRecord[]) {
		const external = depsRecords
			.filter(v => extname(v.url) === '.js')
			.map(v => v.pkgName)
		return external
	}

	private getPkgDepsRecord(paths: string[]) {
		const pkgDepsRecord: PkgDepsRecord = {}

		paths.forEach(v => {
			const pkgname = this.regPkgDep.exec(v)?.[0] as string

			if (!pkgDepsRecord[pkgname])
				pkgDepsRecord[pkgname] = { paths: [], version: '' }

			pkgDepsRecord[pkgname].version = pkg.dependencies?.[pkgname] as string

			if (pkgDepsRecord[pkgname].paths) pkgDepsRecord[pkgname].paths.push(v)
			else pkgDepsRecord[pkgname].paths = [v]
		})
		return { pkgDepsRecord }
	}

	async getVariableNameRecord(depsRecords: DepRecord[]) {
		const names = depsRecords
			.filter(v => extname(v.url) === '.js')
			.map(v => ({ [v.pkgName]: v.globalVariableName }))
			.reduce((preValue, curValue) => Object.assign(preValue, curValue), {})

		return names
	}

	private classifyUrl(depRecords: DepRecord[]) {
		const categoryRecord: Record<string, DepRecord[]> = {}

		depRecords.forEach(v => {
			const ext = extname(v.url).replace('.', '') || 'js'
			categoryRecord[ext]
				? categoryRecord[ext]?.push(v)
				: (categoryRecord[ext] = [v])
		})

		return { categoryRecord }
	}

	public parsedep = debounce(async () => {
		const paths = this.removeNodeModulesFromPath()
		const { pkgDepsRecord } = this.getPkgDepsRecord(paths)
		const { depsRecords } = await getDepsRecords(pkgDepsRecord)
		const { categoryRecord } = this.classifyUrl(depsRecords)

		const globalNames = await this.getVariableNameRecord(depsRecords)

		this.resource.externals = this.resource.externals.concat(
			this.getExternals(depsRecords)
		)
		this.resource.globalVariableNameRecord = merge(
			this.resource.globalVariableNameRecord,
			globalNames
		)
		this.resource.categoryRecord = merge(
			this.resource.categoryRecord,
			categoryRecord
		)

		await writeFile(resourcePath, JSON.stringify(this.resource, null, 4), {
			encoding: 'utf-8'
		})

		this.collectDeps = []
	}, 1500)
}
