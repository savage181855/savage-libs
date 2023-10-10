// a[3].b -> a.3.b -> [a, 3, b]
/** lodash get方法 */
/**
 * @example
 *
 * ```ts
 * const object = { a: [{ b: { c: 3 } }] }
 * console.log(get(object, 'a[0].b.c')) // 3
 * ```
 */
export function get(data: object, path: string) {
	const paths = path
		.replace(/\[(\w+)\]/g, '.$1')
		.replace(/\["(\w+)"\]/g, '.$1')
		.replace(/\['(\w+)'\]/g, '.$1')
		.split('.')

	return paths.reduce((x, y) => x?.[y as keyof object], data)
}

/** 单例模式 */
export function getSingle<T = unknown>(fn: () => T) {
	let res: T

	return function (this: unknown, ...args: unknown[]) {
		return res || (res = fn.apply(this, args as []))
	}
}

export function sleep(delay: number) {
	return new Promise<void>(resolve => {
		setTimeout(() => {
			resolve()
		}, delay)
	})
}

export async function queueExcution(list: (() => Promise<void>)[]) {
	for (const fn of list) {
		await fn()
	}
}
