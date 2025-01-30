<template>
  <div class="relative group flex">
    <!-- Task Timeline Node -->
    <div class="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-4 border-green-500 rounded-full w-6 h-6 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" 
           class="h-4 w-4 text-green-500" 
           fill="none" 
           viewBox="0 0 24 24" 
           stroke="currentColor">
        <path stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    </div>

    <!-- Task Card -->
    <div class="ml-20 pl-4 w-64 hidden group-hover:block">
      <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-2"
           :class="[`border-l-4 ${priorityBorderColor}`]">
        <!-- Task Header -->
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-md font-semibold text-gray-800 truncate w-32">{{ task.name }}</h3>
              <span :class="priorityBadgeStyle" 
                    class="px-2 py-1 text-xs rounded-full font-medium">
                {{ task.priority }}
              </span>
            </div>
          </div>
          
          <!-- Time Remaining Badge -->
          <span :class="timeRemainingStyle" 
                class="text-xs px-2 py-1 rounded-full">
            {{ timeRemaining }}
          </span>
        </div>

        <!-- Task Details -->
        <div class="grid grid-cols-1 gap-2 mt-2">
          <!-- Deadline -->
          <div class="flex items-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" 
                 class="h-4 w-4 mr-2 text-gray-400" 
                 fill="none" 
                 viewBox="0 0 24 24" 
                 stroke="currentColor">
              <path stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-sm truncate">{{ formatDate(task.deadline) }}</span>
          </div>

          <!-- Assigned To -->
          <div class="flex items-center">
            <div class="flex items-center space-x-2">
              <template v-for="userId in task.assignedTo">
              <div class="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                <span class="text-xs text-white font-medium">

                    <span v-if="!isLoading && userIdsMapping[userId]">
                      {{ getInitials(userId) }}
                    </span>
                    <span v-else>...</span>
                  </span>
                </div>
              </template>
              <!-- <span class="text-sm text-gray-600 truncate">{{ task.assignedTo }}</span> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const userIdsMapping = ref({})
const isLoading = ref(true);
const route = useRoute()

const fetchAssignees = async () => {
  try {
    const data = await $fetch('/api/project/assignees', {
      method: "POST",
      body: {
        projectId: route.params.id
      }
    });
    userIdsMapping.value = data.users.reduce((acc, user) => {
      acc[user.user_id] = user.name;
      return acc;
    }, {});
    isLoading.value = false;
  } catch (error) {
    console.error('Error fetching assignees:', error);
  }
};

onMounted(() => {
  fetchAssignees();
});

const props = defineProps({
  task: {
    type: Object,
    required: true,
    validator: (obj) => {
      return obj.name && obj.deadline && obj.priority && obj.assignedTo;
    }
  }
});

const priorityBorderColor = computed(() => {
  const colors = {
    HIGH: 'border-red-500',
    MEDIUM: 'border-yellow-500',
    LOW: 'border-blue-500'
  };
  return colors[props.task.priority.toUpperCase()];
});

const priorityBadgeStyle = computed(() => {
  const styles = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-blue-100 text-blue-800'
  };
  return styles[props.task.priority.toUpperCase()];
});

const timeRemaining = computed(() => {
  const now = new Date();
  const deadline = new Date(props.task.deadline);
  const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'Overdue';
  if (daysRemaining === 0) return 'Due today';
  return `${daysRemaining} days left`;
});

const timeRemainingStyle = computed(() => {
  const daysRemaining = Math.ceil((new Date(props.task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) return 'bg-red-100 text-red-800';
  if (daysRemaining <= 2) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
});

const getInitials = (userId) => {
  // Guard clause for undefined/loading state
  if (isLoading.value || !userIdsMapping.value[userId]) {
    return '...'; // Show loading state
  }

  const name = userIdsMapping.value[userId];
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
</script>