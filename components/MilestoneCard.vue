<template>
  <div class="relative group flex">
    <!-- Milestone Timeline Node -->
    <div class="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-4 border-blue-500 rounded-full w-6 h-6 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" 
           class="h-4 w-4 text-yellow-500" 
           fill="none" 
           viewBox="0 0 24 24" 
           stroke="currentColor">
        <path stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    </div>

    <!-- Milestone Card -->
    <div class="ml-20 pl-4 w-64">
      <div class="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
        <!-- Card Header with Gradient -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-2">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-white truncate w-40">{{ milestone.name }}</h2>
            <div class="flex items-center space-x-2">
              <!-- Edit and Delete icons moved to header -->
              <button @click="$emit('edit')" 
                      class="text-white/80 hover:text-white transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" 
                     class="h-4 w-4" 
                     viewBox="0 0 20 20" 
                     fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button @click="$emit('delete')" 
                      class="text-white/80 hover:text-white transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" 
                     class="h-4 w-4" 
                     viewBox="0 0 20 20" 
                     fill="currentColor">
                  <path fill-rule="evenodd" 
                        d="M10 2a1 1 0 00-1 1v1H5a1 1 0 000 2h10a1 1 0 100-2h-4V3a1 1 0 00-1-1zM4 7a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V7z" 
                        clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Card Body -->
        <div class="p-2">
          <div class="flex items-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" 
                 class="h-4 w-4 mr-2 text-indigo-500" 
                 fill="none" 
                 viewBox="0 0 24 24" 
                 stroke="currentColor">
              <path stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="font-medium">Deadline:</span>
            <span class="ml-2">{{ formatDate(milestone.deadline) }}</span>
          </div>

          <!-- Progress Indicator -->
          <div class="mt-2">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-gray-600">Progress</span>
              <span class="text-sm font-medium text-indigo-600">
                {{ calculateProgress }}%
              </span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full transition-all duration-500"
                   :style="{ width: `${calculateProgress}%` }">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  milestone: {
    type: Object,
    required: true,
    validator: (obj) => {
      return obj.name && obj.deadline && Array.isArray(obj.tasks);
    }
  }
});

defineEmits(['edit', 'delete']);

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const calculateProgress = computed(() => {
  if (!props.milestone.tasks || props.milestone.tasks.length === 0) return 0;
  const completedTasks = props.milestone.tasks.filter(task => task.completed).length;
  return Math.round((completedTasks / props.milestone.tasks.length) * 100);
});
</script>