import { useEffect, useReducer, useRef } from 'react'

import { deepCopy, deepCompare } from 'savage-utils'
import { dataTypes } from 'savage-data-types'

import type {
	DepsType,
	StateType,
	Options,
	Callback,
	Store,
	DepStack
} from './types'

const { isObject } = dataTypes

// global dependency collection
const Dep: DepStack = []

/** create reactive object */
function createReactive<T extends object>(target: T): T {
	const deps: DepsType = new Map()

	const obj = new Proxy(target, {
		get(target, key: string, receiver) {
			const res = Reflect.get(target, key, receiver)
			if (Dep.length > 0) {
				if (!deps.get(key)) deps.set(key, new Set<Callback>())

				Dep.forEach(item => {
					deps.get(key)?.add(item)
				})
			}

			return res
		},
		set(target, key: string, value, receiver) {
			const oldV = deepCopy((target as any)[key])
			const res = Reflect.set(target, key, value, receiver)
			// debugger;
			if (!deepCompare(oldV, value)) {
				deps.get(key)?.forEach(item => item(oldV, value))
			}
			return res
		}
	})

	for (const k in obj) {
		const child = obj[k]
		if (isObject(child)) {
			obj[k] = createReactive(obj[k] as any) as any
		}
	}
	return obj
}

/** set the calculation property, specify this and the incoming state, and collect yourself as the dependency of the state */
function setupComputed(fns: Record<string, Callback>, proxyStore: StateType) {
	if (fns) {
		for (const k in fns) {
			fns[k] = fns[k].bind(proxyStore, proxyStore)
			Dep.push(() => ((proxyStore as any)[k] = fns[k]()))
			;(proxyStore as any)[k] = fns[k]()
			Dep.pop()
		}
	}
}

/** collect dependency used by page */
function useCollectDep() {
	const [, forceUpdate] = useReducer(c => c + 1, 0)
	const callback = useRef<Callback>()
	// 依赖只收集一次
	if (!callback.current) {
		callback.current = function () {
			forceUpdate()
		}
		Dep.push(callback.current)
	}

	useEffect(() => {
		Dep.pop()
	})
}

type Func<T = unknown> = (...args: unknown[]) => T

/** convert actions to solve the problem of this loss in store actions */
function setupActions(plainStore: StateType, proxyStore: StateType) {
	for (const k in plainStore) {
		if (typeof plainStore[k] === 'function') {
			plainStore[k] = (plainStore[k] as Func).bind(proxyStore)
		}
	}
}

/** install the patch method to the store */
function setupPatchOfStore(store: StateType) {
	store.patch = function (val: StateType | Callback) {
		if (typeof val === 'object') {
			for (const k in val) {
				store[k] = (val as any)[k]
			}
		}

		if (typeof val === 'function') {
			val(store)
		}
	}
}

/** install the watch hook to the store */
function setupStoreOfWatcherHook(store: StateType) {
	store.useWatcher = function useWatcher(v: string, fn: Callback) {
		const callback = useRef<Callback>()
		if (!callback.current) callback.current = fn
		Dep.push(callback.current)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const temp = store[v]
		Dep.pop()
	}
}

export function defineStore<
	S extends StateType,
	A extends Record<string, Callback>,
	C = object
>(options: Options<S, A, C>) {
	const actions = options.actions

	// proxy state to collect calculation property dependency
	const state = createReactive(options.state)

	const computed = options.computed as unknown as Record<string, Callback>

	const s = {
		...state,
		...computed,
		...actions
	} as Record<string, StateType | Callback>

	const store = createReactive(s)

	setupActions(s, store)
	setupPatchOfStore(store)
	setupStoreOfWatcherHook(store)
	setupComputed(computed, store as any)

	function useStore(): Store<S, A, C> {
		useCollectDep()
		return store as any
	}
	return useStore
}
