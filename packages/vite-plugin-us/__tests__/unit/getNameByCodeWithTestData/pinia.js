/*!
 * pinia v2.1.7
 * (c) 2023 Eduardo San Martin Morote
 * @license MIT
 */
var Pinia = (function (t, e) {
  'use strict'
  let n
  const i = (t) => (n = t),
    s = Symbol()
  function o(t) {
    return (
      t &&
      'object' == typeof t &&
      '[object Object]' === Object.prototype.toString.call(t) &&
      'function' != typeof t.toJSON
    )
  }
  var r
  ;(t.MutationType = void 0),
    ((r = t.MutationType || (t.MutationType = {})).direct = 'direct'),
    (r.patchObject = 'patch object'),
    (r.patchFunction = 'patch function')
  const c = 'undefined' != typeof window
  const a = () => {}
  function u(t, n, i, s = a) {
    t.push(n)
    const o = () => {
      const e = t.indexOf(n)
      e > -1 && (t.splice(e, 1), s())
    }
    return !i && e.getCurrentScope() && e.onScopeDispose(o), o
  }
  function p(t, ...e) {
    t.slice().forEach((t) => {
      t(...e)
    })
  }
  const f = (t) => t()
  function h(t, n) {
    t instanceof Map && n instanceof Map && n.forEach((e, n) => t.set(n, e)),
      t instanceof Set && n instanceof Set && n.forEach(t.add, t)
    for (const i in n) {
      if (!n.hasOwnProperty(i)) continue
      const s = n[i],
        r = t[i]
      t[i] =
        o(r) && o(s) && t.hasOwnProperty(i) && !e.isRef(s) && !e.isReactive(s)
          ? h(r, s)
          : s
    }
    return t
  }
  const l = Symbol(),
    d = new WeakMap()
  const { assign: y } = Object
  function v(n, s, r = {}, c, v, $) {
    let b
    const _ = y({ actions: {} }, r),
      j = { deep: !0 }
    let O,
      S,
      g,
      m = [],
      R = []
    const P = c.state.value[n]
    let V
    function w(i) {
      let s
      ;(O = S = !1),
        'function' == typeof i
          ? (i(c.state.value[n]),
            (s = { type: t.MutationType.patchFunction, storeId: n, events: g }))
          : (h(c.state.value[n], i),
            (s = {
              type: t.MutationType.patchObject,
              payload: i,
              storeId: n,
              events: g
            }))
      const o = (V = Symbol())
      e.nextTick().then(() => {
        V === o && (O = !0)
      }),
        (S = !0),
        p(m, s, c.state.value[n])
    }
    $ ||
      P ||
      (e.isVue2 ? e.set(c.state.value, n, {}) : (c.state.value[n] = {})),
      e.ref({})
    const M = $
      ? function () {
          const { state: t } = r,
            e = t ? t() : {}
          this.$patch((t) => {
            y(t, e)
          })
        }
      : a
    function A(t, e) {
      return function () {
        i(c)
        const s = Array.from(arguments),
          o = [],
          r = []
        let a
        p(R, {
          args: s,
          name: t,
          store: T,
          after: function (t) {
            o.push(t)
          },
          onError: function (t) {
            r.push(t)
          }
        })
        try {
          a = e.apply(this && this.$id === n ? this : T, s)
        } catch (t) {
          throw (p(r, t), t)
        }
        return a instanceof Promise
          ? a
              .then((t) => (p(o, t), t))
              .catch((t) => (p(r, t), Promise.reject(t)))
          : (p(o, a), a)
      }
    }
    const k = {
      _p: c,
      $id: n,
      $onAction: u.bind(null, R),
      $patch: w,
      $reset: M,
      $subscribe(i, s = {}) {
        const o = u(m, i, s.detached, () => r()),
          r = b.run(() =>
            e.watch(
              () => c.state.value[n],
              (e) => {
                ;('sync' === s.flush ? S : O) &&
                  i({ storeId: n, type: t.MutationType.direct, events: g }, e)
              },
              y({}, j, s)
            )
          )
        return o
      },
      $dispose: function () {
        b.stop(), (m = []), (R = []), c._s.delete(n)
      }
    }
    e.isVue2 && (k._r = !1)
    const T = e.reactive(k)
    c._s.set(n, T)
    const x = ((c._a && c._a.runWithContext) || f)(() =>
      c._e.run(() => (b = e.effectScope()).run(s))
    )
    for (const t in x) {
      const i = x[t]
      if ((e.isRef(i) && (!e.isRef((C = i)) || !C.effect)) || e.isReactive(i))
        $ ||
          (!P ||
            ((E = i), e.isVue2 ? d.has(E) : o(E) && E.hasOwnProperty(l)) ||
            (e.isRef(i) ? (i.value = P[t]) : h(i, P[t])),
          e.isVue2 ? e.set(c.state.value[n], t, i) : (c.state.value[n][t] = i))
      else if ('function' == typeof i) {
        const n = A(t, i)
        e.isVue2 ? e.set(x, t, n) : (x[t] = n), (_.actions[t] = i)
      }
    }
    var E, C
    return (
      e.isVue2
        ? Object.keys(x).forEach((t) => {
            e.set(T, t, x[t])
          })
        : (y(T, x), y(e.toRaw(T), x)),
      Object.defineProperty(T, '$state', {
        get: () => c.state.value[n],
        set: (t) => {
          w((e) => {
            y(e, t)
          })
        }
      }),
      e.isVue2 && (T._r = !0),
      c._p.forEach((t) => {
        y(
          T,
          b.run(() => t({ store: T, app: c._a, pinia: c, options: _ }))
        )
      }),
      P && $ && r.hydrate && r.hydrate(T.$state, P),
      (O = !0),
      (S = !0),
      T
    )
  }
  let $ = 'Store'
  function b(t, e) {
    return Array.isArray(e)
      ? e.reduce(
          (e, n) => (
            (e[n] = function () {
              return t(this.$pinia)[n]
            }),
            e
          ),
          {}
        )
      : Object.keys(e).reduce(
          (n, i) => (
            (n[i] = function () {
              const n = t(this.$pinia),
                s = e[i]
              return 'function' == typeof s ? s.call(this, n) : n[s]
            }),
            n
          ),
          {}
        )
  }
  const _ = b
  return (
    (t.PiniaVuePlugin = function (t) {
      t.mixin({
        beforeCreate() {
          const t = this.$options
          if (t.pinia) {
            const e = t.pinia
            if (!this._provided) {
              const t = {}
              Object.defineProperty(this, '_provided', {
                get: () => t,
                set: (e) => Object.assign(t, e)
              })
            }
            ;(this._provided[s] = e),
              this.$pinia || (this.$pinia = e),
              (e._a = this),
              c && i(e)
          } else
            !this.$pinia &&
              t.parent &&
              t.parent.$pinia &&
              (this.$pinia = t.parent.$pinia)
        },
        destroyed() {
          delete this._pStores
        }
      })
    }),
    (t.acceptHMRUpdate = function (t, e) {
      return () => {}
    }),
    (t.createPinia = function () {
      const t = e.effectScope(!0),
        n = t.run(() => e.ref({}))
      let o = [],
        r = []
      const c = e.markRaw({
        install(t) {
          i(c),
            e.isVue2 ||
              ((c._a = t),
              t.provide(s, c),
              (t.config.globalProperties.$pinia = c),
              r.forEach((t) => o.push(t)),
              (r = []))
        },
        use(t) {
          return this._a || e.isVue2 ? o.push(t) : r.push(t), this
        },
        _p: o,
        _a: null,
        _e: t,
        _s: new Map(),
        state: n
      })
      return c
    }),
    (t.defineStore = function (t, o, r) {
      let c, a
      const u = 'function' == typeof o
      function p(t, r) {
        const p = e.hasInjectionContext()
        ;(t = t || (p ? e.inject(s, null) : null)) && i(t),
          (t = n)._s.has(c) ||
            (u
              ? v(c, o, a, t)
              : (function (t, n, s, o) {
                  const { state: r, actions: c, getters: a } = n,
                    u = s.state.value[t]
                  let p
                  p = v(
                    t,
                    function () {
                      u ||
                        (e.isVue2
                          ? e.set(s.state.value, t, r ? r() : {})
                          : (s.state.value[t] = r ? r() : {}))
                      const n = e.toRefs(s.state.value[t])
                      return y(
                        n,
                        c,
                        Object.keys(a || {}).reduce(
                          (n, o) => (
                            (n[o] = e.markRaw(
                              e.computed(() => {
                                i(s)
                                const n = s._s.get(t)
                                if (!e.isVue2 || n._r) return a[o].call(n, n)
                              })
                            )),
                            n
                          ),
                          {}
                        )
                      )
                    },
                    n,
                    s,
                    0,
                    !0
                  )
                })(c, a, t))
        return t._s.get(c)
      }
      return (
        'string' == typeof t
          ? ((c = t), (a = u ? r : o))
          : ((a = t), (c = t.id)),
        (p.$id = c),
        p
      )
    }),
    (t.getActivePinia = () => (e.hasInjectionContext() && e.inject(s)) || n),
    (t.mapActions = function (t, e) {
      return Array.isArray(e)
        ? e.reduce(
            (e, n) => (
              (e[n] = function (...e) {
                return t(this.$pinia)[n](...e)
              }),
              e
            ),
            {}
          )
        : Object.keys(e).reduce(
            (n, i) => (
              (n[i] = function (...n) {
                return t(this.$pinia)[e[i]](...n)
              }),
              n
            ),
            {}
          )
    }),
    (t.mapGetters = _),
    (t.mapState = b),
    (t.mapStores = function (...t) {
      return t.reduce(
        (t, e) => (
          (t[e.$id + $] = function () {
            return e(this.$pinia)
          }),
          t
        ),
        {}
      )
    }),
    (t.mapWritableState = function (t, e) {
      return Array.isArray(e)
        ? e.reduce(
            (e, n) => (
              (e[n] = {
                get() {
                  return t(this.$pinia)[n]
                },
                set(e) {
                  return (t(this.$pinia)[n] = e)
                }
              }),
              e
            ),
            {}
          )
        : Object.keys(e).reduce(
            (n, i) => (
              (n[i] = {
                get() {
                  return t(this.$pinia)[e[i]]
                },
                set(n) {
                  return (t(this.$pinia)[e[i]] = n)
                }
              }),
              n
            ),
            {}
          )
    }),
    (t.setActivePinia = i),
    (t.setMapStoreSuffix = function (t) {
      $ = t
    }),
    (t.skipHydrate = function (t) {
      return e.isVue2 ? d.set(t, 1) && t : Object.defineProperty(t, l, {})
    }),
    (t.storeToRefs = function (t) {
      if (e.isVue2) return e.toRefs(t)
      {
        t = e.toRaw(t)
        const n = {}
        for (const i in t) {
          const s = t[i]
          ;(e.isRef(s) || e.isReactive(s)) && (n[i] = e.toRef(t, i))
        }
        return n
      }
    }),
    t
  )
})({}, VueDemi)
