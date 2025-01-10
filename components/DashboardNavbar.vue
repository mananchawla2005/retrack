<template>
    <header class="bg-white shadow-md">
      <div class="container mx-auto px-6 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <button @click="toggleSidebar" class="text-gray-500 focus:outline-none md:hidden">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <span class="text-xl font-semibold text-gray-700 ml-2">Dashboard</span>
        </div>
        <div class="flex items-center">
          <div class="relative">
            <input type="text" class="bg-gray-100 rounded-full text-sm focus:outline-none focus:shadow-outline px-3 py-2" placeholder="Search...">
          </div>
          <div class="ml-4">
            <img class="h-10 w-10 rounded-full object-cover" src="https://via.placeholder.com/150" alt="User avatar">
          </div>
        </div>
      </div>
    </header>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const isOpen = ref(false);
  
  const toggleSidebar = () => {
    isOpen.value = !isOpen.value;
  };
  </script>