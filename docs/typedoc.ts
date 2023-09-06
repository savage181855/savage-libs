// const TypeDoc = require('typedoc')
// const path = require('path')
// const fs = require('fs')

import TypeDoc from 'typedoc'
import fs from 'fs'
import { resolve, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

const targets = fs.readdirSync(resolve('..', 'packages')).filter(f => {
	if (!fs.statSync(resolve('..', `packages/${f}`)).isDirectory()) {
		return false
	}
	const pkg = require(`../packages/${f}/package.json`)
	if (pkg.private && !pkg.buildOptions) {
		return false
	}
	return true
})

// 根目录
function rootPath(...args: any) {
	return join(__dirname, '..', ...args)
}

const outputFolderName = 'dist'

// 主函数
async function main() {
	// 初始化 TypeDoc
	const app = new TypeDoc.Application()

	// 使 TypeDoc 拥有读取 tsconfig.json 的能力
	app.options.addReader(new TypeDoc.TSConfigReader())

	// 指定代码入口
	const entries = targets.map(f => {
		return resolve('..', `packages/${f}/src/index.ts`)
	})

	// 指定 TypeDoc 配置项
	app.bootstrap({
		entryPoints: entries,
		tsconfig: rootPath('tsconfig.json'),
		plugin: ['typedoc-plugin-markdown'],
		// allReflectionsHaveOwnDocument: true,
		hideBreadcrumbs: true
		// name: 'motherfuck'
		// disableSources: true
	} as any)

	const project = app.convert()

	if (project) {
		// 输出产物位置
		const outputDir = join(__dirname, outputFolderName)

		// 	// 生成文档内容
		await app.generateDocs(project, outputDir)

		// 生成文档数据结构
		const jsonDir = join(outputDir, 'documentation.json')
		await app.generateJson(project, jsonDir)

		// 解析数据结构，生成 VitePress Config 所需的 Sidebar 配置项
		await joinConfig(jsonDir)
	}
}

main().catch(console.error)

interface IResult {
	text: string
	items: any[]
}

interface IMoudle {
	kindString: string
	name: string
	children: any[]
}

async function joinConfig(jsonDir: string) {
	const result: IResult[] = []

	// 读取文档数据结构的 json 文件
	const buffer = await fs.promises.readFile(jsonDir, 'utf8')
	const data = JSON.parse(buffer.toString())
	if (!data.children || data.children.length <= 0) {
		return
	}

	if (data.groups[0].title !== 'Modules') {
		data.groups.forEach((item: { title: string }) => {
			result.push({
				text: item.title,
				items: []
			})
		})
	}

	data.children.forEach((module: IMoudle) => {
		function getIndex(reg: string) {
			const i = result.findIndex(v => {
				return new RegExp(reg).test(v.text)
			})

			return i
		}
		if (module.kindString !== 'Module') {
			const actionsType = {
				Variable() {
					result[getIndex('Variables')].items.push({
						text: `${module.name}`,
						link: getVariablesPath(module.name)
					})
				},
				Class() {
					result[getIndex('Classes')].items.push({
						text: `${module.name}`,
						link: getClassPath(module.name)
					})
				},
				Interface() {
					result[getIndex('Interfaces')].items.push({
						text: `${module.name}`,
						link: getInterfacePath(module.name)
					})
				},
				'Type alias': () => {
					result[getIndex('Type Aliases')].items.push({
						text: `${module.name}`,
						link: getTypePath(module.name)
					})
				},
				Function() {
					result[getIndex('Functions')].items.push({
						text: `${module.name}`,
						link: getFunctionPath(module.name)
					})
				}
			} as any

			actionsType[module.kindString]()

			return
		}
		// Module 作为一级导航
		const moduleConfig = {
			text: module.name,
			items: [{ text: module.name, link: getModulePath(module.name) }]
		}

		module.children.forEach(sub => {
			// 类、接口、类型、函数作为二级导航
			if (sub.kindString === 'Class') {
				moduleConfig.items.push({
					text: `Class:${sub.name}`,
					link: getClassPath(module.name, sub.name)
				})
			} else if (sub.kindString === 'Interface') {
				moduleConfig.items.push({
					text: `Interface:${sub.name}`,
					link: getInterfacePath(module.name, sub.name)
				})
			} else if (sub.kindString === 'Type alias') {
				moduleConfig.items.push({
					text: `Type:${sub.name}`,
					link: getTypePath(module.name, sub.name)
				})
			} else if (sub.kindString === 'Function') {
				moduleConfig.items.push({
					text: `Function:${sub.name}`,
					link: getFunctionPath(module.name, sub.name)
				})
			}
		})
		result.push(moduleConfig)
	})

	// 转换成的导航数据输出到 doc/apidocConfig.json
	await fs.promises.writeFile(
		join(__dirname, 'apidocConfig.json'),
		JSON.stringify(result),
		'utf8'
	)
}

function transformModuleName(name: string) {
	return name.replace(/\//g, '_')
}

function getModulePath(name: string) {
	return join('/dist/modules', `${transformModuleName(name)}`).replace(
		/\\/g,
		'/'
	)
}

function getVariablesPath(moduleName: string, typeName = '') {
	const name = typeName
		? `${transformModuleName(moduleName)}.${typeName}`
		: transformModuleName(moduleName)
	return join(`/${outputFolderName}/variables`, `${name}`).replace(/\\/g, `/`)
}

function getClassPath(moduleName: string, className = '') {
	const name = className
		? `${transformModuleName(moduleName)}.${className}`
		: transformModuleName(moduleName)
	return join(`/${outputFolderName}/classes`, `${name}`).replace(/\\/g, `/`)
}

function getInterfacePath(moduleName: string, interfaceName = '') {
	const name = interfaceName
		? `${transformModuleName(moduleName)}.${interfaceName}`
		: transformModuleName(moduleName)
	return join(`/${outputFolderName}/interfaces`, `${name}`).replace(/\\/g, `/`)
}

function getTypePath(moduleName: string, typeName = '') {
	const name = typeName
		? `${transformModuleName(moduleName)}.${typeName}`
		: transformModuleName(moduleName)
	return join(`/${outputFolderName}/types`, `${name}`).replace(/\\/g, `/`)
}

function getFunctionPath(moduleName: string, functionName = '') {
	const name = functionName
		? `${transformModuleName(moduleName)}.${functionName}`
		: transformModuleName(moduleName)
	return join(`/${outputFolderName}/functions`, `${name}`).replace(/\\/g, `/`)
}
