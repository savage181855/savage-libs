import { describe, expect, vi, test } from 'vitest'
import {
	get,
	compareShallow,
	compareDeep,
	copyShallow,
	copyDeep,
	eventCenter,
	getSingle,
	Iterator,
	each,
	mergeShallow,
	mergeDeep,
	debounce,
	throttle,
	installEventCenter
} from '../src'

describe('functions', () => {
	test('get', () => {
		const object = { a: [{ b: { c: 3 } }] }
		expect(get(object, 'a[0].b.c')).toEqual(3)
		expect(get(object, 'a[0]')).toEqual({ b: { c: 3 } })
	})

	test('getSingle', () => {
		const fun = () => {
			return {}
		}
		const singleFun = getSingle(fun)

		const a = singleFun()
		const b = singleFun()

		expect(a).toEqual(b)
	})
})

test('compare', () => {
	const a = {
		foo: {
			bar: 'dog'
		}
	}

	const b = {
		...a
	}

	const c = {
		foo: {
			bar: 'dog'
		}
	}
	expect(compareShallow(a, b)).toEqual(true)
	expect(compareShallow(a, c)).toEqual(false)
	expect(compareDeep(a, b)).toEqual(true)
	expect(compareDeep(a, c)).toEqual(true)
})

test('copy', () => {
	const targetObj = {
		foo: {
			bar: 'dog'
		}
	}

	const b = copyShallow(targetObj)
	b.foo.bar = 'cat'

	const c = copyDeep(targetObj)
	c.foo.bar = 'no'

	expect(b).toEqual(targetObj)
	expect(c).not.toEqual(targetObj)

	const targetArr = [targetObj]
	const copiedArrShallow = copyShallow(targetArr)
	const copiedArrDeep = copyDeep(targetArr)
	copiedArrDeep[0].foo = { bar: 'firefly' }

	expect(copiedArrShallow).toEqual(targetArr)
	expect(copiedArrDeep).not.toEqual(targetArr)
})

describe('evenCenter', () => {
	test('eventCenter', () => {
		let value = 0
		const callback = (v: number) => {
			value = v
		}

		eventCenter.subscribe('change value', callback)
		eventCenter.publish('change value', 5)

		expect(value).toEqual(5)
		eventCenter.remove('change value', callback)
		eventCenter.publish('change value', 6)
		expect(value).toEqual(5)
	})

	test('installEventCenter', () => {
		const obj = installEventCenter({ a: 'hello' })

		expect(obj.a).toEqual('hello')

		let value = 0
		const callback = (v: number) => {
			value = v
		}

		eventCenter.subscribe('change value', callback)
		eventCenter.publish('change value', 5)

		expect(value).toEqual(5)
		eventCenter.remove('change value', callback)
		eventCenter.publish('change value', 6)
		expect(value).toEqual(5)
	})
})

describe('Iterator', () => {
	const a = {
		foo: 'foo1',
		bar: 'bar1',
		dog: 'dog2'
	}

	const b = ['foo', 'bar', 'dog']

	test('each', () => {
		const a2 = {} as typeof a

		const a3 = {} as typeof a2

		each(a, (v, i) => {
			const key = i as keyof typeof a2
			a2[key] = a[key]
		})

		each(a, (v, i) => {
			const key = i as keyof typeof a2
			if (i === 'bar') return false
			a3[key] = a[key]
		})

		expect(a3).toEqual({ foo: 'foo1' })
		expect(a2).toEqual(a)

		const b2 = [] as typeof b
		const b3 = [] as typeof b

		each(b, (v, i) => {
			const key = i as keyof typeof b2
			// @ts-ignore
			b2[key] = b[key]
		})

		expect(b2).toEqual(b)

		each(b, (v, i) => {
			const key = i as keyof typeof b2
			if (i === String(2)) return false
			// @ts-ignore
			b3[key] = b[key]
		})

		expect(b3).toEqual(['foo', 'bar'])
	})

	test('Iterator', () => {
		const b = ['foo', 'bar', 'dog']
		const ib = new Iterator(b)

		ib.next()

		expect(ib.length).toEqual(3)
		expect(ib.getCurrentItem()).toEqual('bar')
		ib.next()
		expect(ib.isDone()).toEqual(true)
	})
})

test('merge', () => {
	const a = {
		foo: {
			bar: 'dog'
		}
	}

	const ab = Object.assign(a, { shit: 'shit' })

	const b = mergeShallow({ shit: 'shit' }, a)

	a.foo.bar = 'cat'
	expect(b).toEqual(ab)

	const c = mergeDeep({}, a)

	c.foo.bar = 'no'
	expect(c).not.toEqual(a)
})

describe('optimization', () => {
	vi.useFakeTimers()

	test('debounce', () => {
		let value = 0

		function add() {
			value++
		}
		const add2 = debounce(add, 10)

		const arr = [1, 2, 3, 4, 5]

		arr.forEach(() => {
			add()
			add2()
		})
		vi.runAllTimers()
		expect(value).toEqual(6)
	})

	test('throttle', () => {
		let value = 0

		function add() {
			value++
		}
		const add2 = throttle(add, 100)
		const t = setInterval(() => {
			add2()
		}, 1)

		setTimeout(() => {
			clearInterval(t as unknown as number)
		}, 1000)

		vi.runAllTimers()
		expect(value).toEqual(10)
	})
})
