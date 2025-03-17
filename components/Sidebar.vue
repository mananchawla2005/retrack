<template>
  <div class="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out" :class="{ 'translate-x-0': isOpen }">
    <a href="#" class="text-white flex items-center space-x-2 px-4">
      <span class="text-2xl font-extrabold">Logo</span>
    </a>
    <nav class="space-y-2">
      <nuxt-link to="/dashboard" 
                 class="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
                 :class="{ 'bg-gray-700': isActiveRoute('/dashboard') }">
        Dashboard
      </nuxt-link>
      
      <div class="px-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">Projects</span>
          <nuxt-link to="/project" class="p-1 hover:bg-gray-700 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </nuxt-link>
        </div>
        <div class="space-y-1">
          <nuxt-link v-for="project in projects" 
                     :key="project.id" 
                     :to="`/dashboard/project/${project.id}`"
                     class="block py-2 px-3 rounded text-sm hover:bg-gray-700"
                     :class="{ 'bg-blue-600 hover:bg-blue-700': isActiveProject(project.id) }">
            {{ project.name }}
          </nuxt-link>
        </div>
      </div>

      <nuxt-link to="/dashboard/literature" 
                 class="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
                 :class="{ 'bg-gray-700': isActiveRoute('/dashboard/literature') }">
        Literature
      </nuxt-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const route = useRoute();
const isOpen = ref(false);
const projects = ref([]);

const isActiveProject = (projectId) => {
  return route.params.id === projectId.toString();
};

const isActiveRoute = (path) => {
  return route.path === path;
};

onMounted(async () => {
  try {
    const response = await fetch('/api/project/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    projects.value = data.projects;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  }
});
</script>