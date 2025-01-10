<template>
    <div class="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out" :class="{ 'translate-x-0': isOpen }">
      <a href="#" class="text-white flex items-center space-x-2 px-4">
        <span class="text-2xl font-extrabold">Logo</span>
      </a>
      <nav>
        <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Dashboard</a>
        <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Projects</a>
        <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Settings</a>
        <section>
            <h2>Literature</h2>
            <nuxt-link to="/dashboard/literature">Manage Literature</nuxt-link>
          </section>
      </nav>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const isOpen = ref(false);
  </script> 