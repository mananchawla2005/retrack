<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- User Profile Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex items-center space-x-4">
        <div class="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold">
          {{ userInitials }}
        </div>
        <div>
          <h1 class="text-2xl font-bold">{{ user.name }}</h1>
          <p class="text-gray-600">{{ user.email }}</p>
        </div>
      </div>
    </div>

    <!-- Statistics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-2">Active Projects</h3>
        <p class="text-3xl font-bold text-blue-600">{{ stats.activeProjects }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-2">Pending Tasks</h3>
        <p class="text-3xl font-bold text-orange-600">{{ stats.taskStats?.pending_tasks || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-2">Completed Tasks</h3>
        <p class="text-3xl font-bold text-green-600">{{ stats.taskStats?.completed_tasks || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-2">Task Completion Rate</h3>
        <p class="text-3xl font-bold text-purple-600">
          {{ completionRate }}%
        </p>
      </div>
    </div>

    <!-- Task Progress -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-bold mb-4">Task Progress by Priority</h2>
      <div class="h-64">
        <canvas id="priorityChart" ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- Upcoming Deadlines -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Upcoming Deadlines</h2>
        <select v-model="deadlineFilter" class="border rounded-lg px-3 py-1">
          <option value="all">All Tasks</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <div class="space-y-4">
        <div v-for="deadline in filteredDeadlines" :key="deadline.id" 
             class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div class="flex items-center space-x-4">
            <div class="w-2 h-2 rounded-full" :class="getPriorityColor(deadline.priority)"></div>
            <div>
              <h3 class="font-semibold">{{ deadline.name }}</h3>
              <p class="text-sm text-gray-600">{{ deadline.project_name }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-medium" :class="getDeadlineColor(deadline.daysLeft)">
              {{ getDaysLeft(deadline.date) }} days left
            </p>
            <p class="text-sm text-gray-600">{{ formatDate(deadline.date) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Teams -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-bold mb-4">Project Teams</h2>
      <div class="space-y-4">
        <div v-for="project in stats.projects" :key="project.id" 
             class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div>
            <h3 class="font-semibold">{{ project.name }}</h3>
            <p class="text-sm text-gray-600">Role: {{ project.role }}</p>
          </div>
          <button v-if="project.role !== 'owner'"
                  @click="leaveProject(project.id)"
                  class="text-red-600 hover:text-red-800">
            Leave Team
          </button>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4">Recent Activity</h2>
      <div class="space-y-4">
        <div v-for="item in stats.timeline" :key="item.id" 
             class="flex items-start space-x-4 p-4 border-b last:border-b-0">
          <div class="w-8 h-8 rounded-full flex items-center justify-center"
               :class="getActivityBackground(item)">
            <svg class="w-4 h-4" :class="getActivityIconColor(item)"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    :d="getActivityIcon(item)" />
            </svg>
          </div>
          <div>
            <p class="font-medium">{{ getActivityDescription(item) }}</p>
            <p class="text-sm text-gray-600">{{ formatDate(item.date) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

Chart.register(...registerables)

const user = ref({})
const stats = ref({
  taskStats: null,
  timeline: [],
  activeProjects: 0,
  priorityDistribution: []
})
const deadlineFilter = ref('all')
let priorityChartInstance = null
const chartCanvas = ref(null)

// Computed properties
const completionRate = computed(() => {
  const completed = parseInt(stats.value.taskStats?.completed_tasks) || 0
  console.log(stats.value.taskStats)
  const total = parseInt(stats.value.taskStats?.completed_tasks || 0) + parseInt(stats.value.taskStats?.pending_tasks || 0)
  console.log(completed, total)
  return total ? Math.round((completed / total) * 100) : 0
})

const userInitials = computed(() => {
  if (!user.value.name) return '';
  return user.value.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
});

const filteredDeadlines = computed(() => {
  if (!stats.value.upcomingDeadlines) return [];
  
  const now = new Date();
  const deadlines = stats.value.upcomingDeadlines.filter(task => !task.completed); // Add this filter
  
  if (deadlineFilter.value === 'week') {
    const weekRange = { start: startOfWeek(now), end: endOfWeek(now) };
    return deadlines.filter(task => isWithinInterval(new Date(task.date), weekRange));
  }
  
  if (deadlineFilter.value === 'month') {
    const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };
    return deadlines.filter(task => isWithinInterval(new Date(task.date), monthRange));
  }
  
  return deadlines;
});

// Helper functions
const updatePriorityChart = () => {
  if (priorityChartInstance) {
    priorityChartInstance.destroy()
  }

  const ctx = chartCanvas.value?.getContext('2d')
  if (!ctx) return

  const priorities = stats.value.priorityDistribution || []
  
  priorityChartInstance = new Chart(ctx, {
    id: 'priorityChart', // Add unique ID
    type: 'bar',
    data: {
      labels: priorities.map(p => p.priority.toUpperCase()),
      datasets: [{
        label: 'Tasks by Priority',
        data: priorities.map(p => p.count),
        backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

const getDeadlineColor = (daysLeft) => {
  if (typeof daysLeft === 'string' && daysLeft === 'Overdue') return 'text-red-600';
  const days = Number(daysLeft);
  if (days <= 2) return 'text-red-600';
  if (days <= 7) return 'text-orange-600';
  return 'text-green-600';
};

const getDaysLeft = (date) => {
  const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  return days < 0 ? 'Overdue' : days;
};

const getPriorityColor = (priority) => ({
  'high': 'bg-red-500',
  'medium': 'bg-yellow-500',
  'low': 'bg-blue-500'
}[priority?.toLowerCase()] || 'bg-gray-500')

const getActivityDescription = (item) => {
  if (item.type === 'task') {
    return `${item.completed ? 'Completed' : 'Updated'} task: ${item.name}`
  }
  return `Added milestone: ${item.name}`
}

const getActivityIcon = (item) => {
  if (item.type === 'task') {
    return item.completed 
      ? 'M5 13l4 4L19 7'
      : 'M12 6v6m0 0v6m0-6h6m-6 0H6'
  }
  return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
}

const getActivityBackground = (item) => ({
  'task': item.completed ? 'bg-green-100' : 'bg-yellow-100',
  'milestone': 'bg-blue-100'
}[item.type] || 'bg-gray-100')

const getActivityIconColor = (item) => ({
  'task': item.completed ? 'text-green-600' : 'text-yellow-600',
  'milestone': 'text-blue-600'
}[item.type] || 'text-gray-600')

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const leaveProject = async (projectId) => {
  try {
    await $fetch('/api/project/leave', {
      method: 'POST',
      body: { projectId }
    })
    // Refresh stats to update project list
    const statsData = await $fetch('/api/stats/userstats', { method: 'POST' })
    stats.value = {
      ...statsData,
      activeProjects: statsData.activeProjects || 0,
      taskStats: {
        completed_tasks: statsData.taskStats?.completed_tasks || 0,
        pending_tasks: statsData.taskStats?.pending_tasks || 0
      }
    }
  } catch (error) {
    console.error('Error leaving project:', error)
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Fetch user data
    const userData = await $fetch('/api/user', { method: 'GET' })
    user.value = userData

    // Fetch user-specific stats
    const statsData = await $fetch('/api/stats/userstats', { method: 'POST' })
    stats.value = {
      ...statsData,
      activeProjects: statsData.activeProjects || 0,
      taskStats: {
        completed_tasks: statsData.taskStats?.completed_tasks || 0,
        pending_tasks: statsData.taskStats?.pending_tasks || 0
      }
    }

    // Initialize priority chart
    nextTick(() => {
      updatePriorityChart()
    })
  } catch (error) {
    console.error('Error fetching user data:', error)
  }
})

onUnmounted(() => {
  if (priorityChartInstance) {
    priorityChartInstance.destroy()
  }
})
</script>