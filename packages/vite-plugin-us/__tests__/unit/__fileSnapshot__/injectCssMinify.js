;((n) => {
  window.addEventListener('DOMContentLoaded', () => {
    if (
      (n.links.forEach((e) => {
        const t = document.createElement('link')
        ;(t.rel = 'stylesheet'), (t.href = e), document.head.appendChild(t)
      }),
      n.inline)
    ) {
      const e = document.createElement('style')
      ;(e.dataset.vitePluginId = n.pluginName),
        (e.textContent = n.inline),
        document.head.appendChild(e)
    }
  })
})({ links: ['abc.css', 'foo.css'], minify: !0, pluginName: 'vite-plugin-us' })
