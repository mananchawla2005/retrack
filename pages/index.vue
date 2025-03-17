<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">AI Research and Team Collaboration Tracker</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Your Tasks</h2>
        <p class="mb-4">Track and manage your tasks and milestones across all projects.</p>
        <NuxtLink to="/kanban" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200">
          View Kanban Board
        </NuxtLink>
      </div>
      
      <!-- Add other dashboard sections here -->
    </div>
  </div>
</template>