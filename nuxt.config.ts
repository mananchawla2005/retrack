// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  build: {
    transpile: ['@tato30/vue-pdf', 'vuedraggable']
  },
  runtimeConfig: {
    dbUri: "",
    githubClientSecret: '',
    githubClientId: '',
    googleClientSecret: '',
    googleClientId: '',
    azureStorageConnectionString: ''
  },

  modules: ["@nuxtjs/tailwindcss", '@pinia/nuxt', '@vueuse/nuxt'],

  // Add client-only directive for better handling of client-side components
  experimental: {
    componentIslands: true,
  },
  
  // Ensure vuedraggable is loaded client-side only
    
  // Disable SSR for specific routes
  routeRules: {
    '/kanban': { ssr: false }
  }
})