import { reactive, isReactive } from '../../src/reactive/reactive'

describe('reactive', () => {
	test('Object', () => {
		const original = { foo: 1 }
		const observed = reactive(original)
		expect(observed).not.toBe(original)
		expect(isReactive(observed)).toBe(true)
		expect(isReactive(original)).toBe(false)
		// get
		expect(observed.foo).toBe(1)
		// has
		expect('foo' in observed).toBe(true)
		// ownKeys
		expect(Object.keys(observed)).toEqual(['foo'])
		observed.foo = 2
	})

	test('proto', () => {
		const obj = {}
		const reactiveObj = reactive(obj)
		expect(isReactive(reactiveObj)).toBe(true)
		// eslint-disable-next-line no-proto
		const prototype = (reactiveObj as any).__proto__
		const otherObj = { data: ['a'] }
		expect(isReactive(otherObj)).toBe(false)
		const reactiveOther = reactive(otherObj)
		expect(isReactive(reactiveOther)).toBe(true)
		expect(reactiveOther.data[0]).toBe('a')
	})

	test('nested reactives', () => {
		const original = {
			nested: {
				foo: 1
			},
			array: [{ bar: 2 }]
		}
		const observed = reactive(original)
		expect(isReactive(observed.nested)).toBe(true)
		expect(isReactive(observed.array)).toBe(true)
		expect(isReactive(observed.array[0])).toBe(true)
	})

	test('observing subtypes of IterableCollections(Map, Set)', () => {
		// subtypes of Map
		class CustomMap extends Map {}
		const cmap = reactive(new Map())

		expect(cmap).toBeInstanceOf(Map)
		expect(isReactive(cmap)).toBe(true)

		console.log(cmap.set)

		cmap.set('key', {})
		// expect(isReactive(cmap.get('key'))).toBe(true)

		// subtypes of Set
		class CustomSet extends Set {}
		const cset = reactive(new CustomSet())

		expect(cset).toBeInstanceOf(Set)
		expect(isReactive(cset)).toBe(true)
	})
})
