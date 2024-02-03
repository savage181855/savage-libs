# Basic usage

By enabling the persist plugin on your store, the whole state will be stored in the sessionStorage by default.

The store id is used as the storage key (to set a custom storage key)

::: code-group

```ts [store.ts]
import { defineStore } from 'react-liberate'

export const useAppStore = defineStore('appStore', {
  state: () => {
    return {
      firstName: 'S',
      lastName: 'L',
      accessToken: 'xxxxxxxxxxxxx'
    }
  },
  actions: {
    setToken (value: string) {
      this.accessToken = value
    }
  },
  persist: {
    enabled: true
  }
})
```
:::