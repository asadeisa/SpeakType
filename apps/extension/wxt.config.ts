import { defineConfig } from 'wxt'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'SpeakType',
    description: 'Voice-to-text for every input on the web',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
  },
})
