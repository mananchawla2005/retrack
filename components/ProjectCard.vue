<template>
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-bold mb-2">{{ project.title }}</h2>
      <p class="text-gray-700">{{ project.description }}</p>
    </div>
  </template>
  
  <script setup>
  defineProps({
    project: {
      type: Object,
      required: true
    }
  });
  </script>