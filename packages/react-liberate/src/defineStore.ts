import { useEffect, useReducer, useRef } from 'react'

import { copyDeep, debounce } from 'savage-utils'
import { isObject, isArray } from 'savage-types'

import type {
	DepsType,
	StateTree,
	DefineStoreOptions,
	Callback,
	Store,
	DepStack,
	LiberatePlugin,
	_GettersTree,
	_ActionsTree
} from './types'

// global dependency collection
const Dep: DepStack = []

function pushDep(fn: Callback) {
	Dep.push(fn)
}

function removeDep() {
	Dep.pop()
}

function getDep() {
	return Dep.length > 0 ? Dep[Dep.length - 1] : undefined
}

const subscribe: Set<() => unknown> = new Set()

const plugins: LiberatePlugin[] = []

function createReactive<T extends object>(target: T): T {
	const dataDepRecord: DepsType = new Map()

	const obj = new Proxy(target, {
		get(target, key: string, receiver) {
			// debugger
			const res = Reflect.get(target, key, receiver)
			const dep = getDep()

			if (dep) {
				if (!dataDepRecord.get(key)) dataDepRecord.set(key, new Set<Callback>())
				dataDepRecord.get(key)?.add(dep)
			}

			return res
		},
		set(target, key, value, receiver) {
			// debugger
			const oldV = copyDeep(target[key as keyof T] as object) as StateTree
			const status = Reflect.set(target, key, value, receiver)
			dataDepRecord.get(key)?.forEach(dep => dep(oldV, value))
			subscribe.forEach(fn => fn())
			return status
		}
	})

	for (const k in obj) {
		const child = obj[k]
		if (isObject(child) || isArray(child)) {
			obj[k] = createReactive(child as object) as T[Extract<keyof T, string>]
		}
	}
	return obj
}

/** collect dependency used by components */
function useCollectDep() {
	const [, forceUpdate] = useReducer(c => c + 1, 0)
	const callback = useRef<Callback>()

	// prevent collect dependencies if re-render
	if (!callback.current) {
		callback.current = forceUpdate
		pushDep(callback.current)
	}
	useEffect(removeDep)
}

export function loadPlugin(plugin: LiberatePlugin) {
	plugins.push(plugin)
}

export function defineStore<
	Id extends string = string,
	S extends StateTree = StateTree,
	G extends _GettersTree<S> = _GettersTree<S>,
	A extends _ActionsTree = _ActionsTree
>(id: string, options: DefineStoreOptions<Id, S, G, A>) {
	const { state, actions, getters } = options

	const initState = state()

	const baseStore = createReactive({
		...state(),
		...getters,
		...actions
	})

	for (const k in actions) {
		// @ts-ignore
		baseStore[k] = baseStore[k].bind(baseStore)
	}

	for (const k in getters) {
		// @ts-ignore
		getters[k] = getters[k].bind(baseStore, baseStore)
		// @ts-ignore
		pushDep(() => (baseStore[k] = getters[k]()))
		// @ts-ignorere
		baseStore[k] = getters[k]()
		removeDep()
	}

	const $state = createReactive(state())
	for (const k in $state) {
		// @ts-ignore
		pushDep((oldV, newV) => ($state[k] = newV))
		const tempStoreValue = baseStore[k]
		removeDep()

		pushDep((oldV, newV) => {
			// @ts-ignore
			if (!Object.is(newV, baseStore[k])) baseStore[k] = newV
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const temp$stateValue = $state[k]
		removeDep()

		$state[k] = tempStoreValue
	}

	function $patch(val: Partial<S> | ((arg: S) => unknown)) {
		if (typeof val === 'object') {
			for (const k in val) {
				// @ts-ignore
				baseStore[k] = val[k]
			}
		}

		if (typeof val === 'function') {
			val(baseStore)
		}
	}

	function $reset() {
		function merge<T>(x: T, y: T) {
			for (const k in y) {
				const value = y[k]

				if (isObject(value)) {
					merge(x[k], value)
				} else if (isArray(value)) {
					// @ts-ignore
					x[k].length = value.length
					// @ts-ignore
					value.forEach((_, k2) => (x[k][k2] = value[k2]))
				} else {
					x[k] = y[k]
				}
			}
		}
		merge($state, initState)
	}

	let apiExecuteEnv: 'component' | 'js' = 'js'

	function $subscribe(cb: () => unknown) {
		if (apiExecuteEnv === 'component') {
			const callback = useRef<typeof cb>()
			if (!callback.current) callback.current = debounce(() => cb(), 0)
			subscribe.add(callback.current)
		} else {
			subscribe.add(debounce(() => cb(), 0))
		}
	}

	const store = Object.assign(baseStore, {
		$id: id,
		$state,
		$patch,
		$subscribe,
		$reset
	}) as Store<Id, S, G, A>

	setTimeout(() => {
		plugins.forEach(p => {
			Object.assign(
				store,
				p({
					store,
					// @ts-ignore
					options
				}) || {}
			)
		})
	}, 0)

	function useStore() {
		apiExecuteEnv = 'component'

		useEffect(() => {
			apiExecuteEnv = 'js'
		})

		useCollectDep()
		return store
	}
	return useStore
}