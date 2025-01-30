// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  build: {
    transpile: ['@tato30/vue-pdf']
  },
  runtimeConfig: {
    dbUri: "",
    githubClientSecret: '',
    githubClientId: '',
    googleClientSecret: '',
    googleClientId: '',
    azureStorageConnectionString: ''
  },

  modules: ["@nuxtjs/tailwindcss"]
})
