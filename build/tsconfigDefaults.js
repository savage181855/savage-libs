export const tsconfigDefaults = {
	compilerOptions: {
		baseUrl: '.',
		outDir: 'temp',
		newLine: 'LF',
		useDefineForClassFields: false,
		moduleResolution: 'bundler',
		allowJs: false,
		strict: true,
		noUnusedLocals: true,
		experimentalDecorators: true,
		isolatedModules: true,
		skipLibCheck: true,
		jsx: 'preserve',
		types: ['node'],
		rootDir: '.',
		sourceMap: true, // 是否生成sourceMap
		target: 'es6', // 编译目标
		module: 'esnext', // 模块类型
		resolveJsonModule: true, // 加载json
		esModuleInterop: true,
		removeComments: false, // 删除注释
		noEmit: true,
		declaration: true, // 生成定义文件
		declarationDir: './dist',
		declarationMap: false,
		lib: ['esnext', 'dom'] // 导入库类型定义
	},
	paths: {
		// "savage-*": ["packages/savage-*/src"],
		'savage-data-types': ['packages/data-types/src/index.ts']
	},
	include: ['packages/*/src', './build/rollup.config.ts']
}
