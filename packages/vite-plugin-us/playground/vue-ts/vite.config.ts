import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

import { us } from '../../src'

export default defineConfig({
  plugins: [
    vue(),
    // AutoImport({
    // 	resolvers: [ElementPlusResolver()]
    // }),
    // Components({
    // 	resolvers: [ElementPlusResolver()]
    // }),
    us({
      entry: 'src/main.ts',
      metaData: {
        name: 'vue-ts',
        version: '1',
        author: 'savage',
        description: 'developing plugin',
        include: ['http://localhost:5501/packages/vite-plugin-us/index.html'],
        match: ['https://translate.google.com/*', ''],
        // runAt: '',
        runAt: 'document_start',
        require: [
          // 'https://unpkg.com/vue@3'
          //  'https://unpkg.com/element-plus'
        ]
      },
      server: {
        port: 12345
        // open: false
      },
      build: {
        minify: false,
        external: {
          autoCDN: true
          // exclusions: ['element-plus']
        },
        cssMinify: false
      },
      generate: {
        modifyMetadata(code, mode) {
          return code + '\n' + '// hi, there' + mode
        },
        modifyBundle(code) {
          return code + '\n' + '// hi, there'
        }
      }
    })
  ]
})
