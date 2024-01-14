import { defineStore } from '../src'

describe('store.$reset', () => {
	const useStore = defineStore('main', {
		state: () => ({
			name: 'Eduardo',
			counter: 0,
			nested: { n: 0 }
		})
	})

	beforeEach(() => {
		const store = useStore()
		store.$reset()
	})

	it('can reset the state', () => {
		const store = useStore()
		store.name = 'Ed'

		store.nested.n++
		store.$reset()

		expect(store.$state).toEqual({
			counter: 0,
			name: 'Eduardo',
			nested: {
				n: 0
			}
		})
	})

	it('can reset the state of an empty store', () => {
		const store = defineStore('a', {})()
		expect(store.$state).toEqual({})
		store.$reset()
		expect(store.$state).toEqual({})
	})
})
