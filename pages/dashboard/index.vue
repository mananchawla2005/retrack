<template>

    <div>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <!-- Project Counter -->
          <div class="p-2 bg-white rounded shadow flex items-center justify-center">
            <div class="text-center">
              <h2 class="text-md font-semibold">Total Projects</h2>
              <div class="circle">
                <p class="text-2xl font-bold">{{ totalProjects }}</p>
              </div>
            </div>
          </div>
          <!-- Task Stats -->
          <div class="p-2 bg-white rounded shadow flex flex-col items-center">
            <h2 class="text-md font-semibold text-center mb-2">Tasks Overview</h2>
            <div class="flex items-center">
              <div class="chart-container">
                <canvas id="tasksChart"></canvas>
              </div>
              <div class="chart-legend ml-2">
                <ul>
                  <li><span class="legend-color bg-green-500"></span> Completed ({{ stats.taskStats?.completed_tasks || 0 }})</li>
                  <li><span class="legend-color bg-red-500"></span> Pending ({{ stats.taskStats?.pending_tasks || 0 }})</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline Section -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Activity Timeline</h2>
            <div class="flex gap-2">
              <button 
                v-for="period in ['Week', 'Month', 'Year']" 
                :key="period"
                @click="timeRange = period.toLowerCase()"
                :class="[
                  'px-3 py-1 rounded-md text-sm',
                  timeRange === period.toLowerCase()
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                {{ period }}
              </button>
            </div>
          </div>

          <!-- Timeline Graph -->
          <div class="relative h-96 mb-6">
            <canvas ref="timelineChart"></canvas>
          </div>

          <!-- Timeline Details -->
          <div class="mt-8">
            <div v-for="(group, date) in groupedTimeline" :key="date" class="mb-6">
              <h3 class="text-sm font-medium text-gray-500 mb-3">{{ formatDateHeader(date) }}</h3>
              <div class="space-y-3">
                <div 
                  v-for="item in group" 
                  :key="item.id"
                  class="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  :class="{'border-l-4': true, ...getItemStyles(item)}"
                >
                  <!-- Item Icon -->
                  <div class="mr-4">
                    <div v-if="item.type === 'task'" class="w-8 h-8 rounded-full flex items-center justify-center"
                         :class="item.completed ? 'bg-green-100' : 'bg-yellow-100'">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                           :class="item.completed ? 'text-green-600' : 'text-yellow-600'"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              :d="item.completed 
                                   ? 'M5 13l4 4L19 7'
                                   : 'M12 6v6m0 0v6m0-6h6m-6 0H6'" />
                      </svg>
                    </div>
                    <div v-else class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    </div>
                  </div>

                  <!-- Item Content -->
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <h4 class="font-medium text-gray-900">{{ item.name }}</h4>
                      <span :class="getPriorityClass(item.priority)" 
                            class="text-xs px-2 py-1 rounded-full">
                        {{ item.type === 'milestone' ? 'Milestone' : item.priority }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600">
                      {{ item.project_name }}
                      {{ item.milestone_name ? `/ ${item.milestone_name}` : '' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
</template>


<script setup lang="js">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { Chart, registerables } from 'chart.js';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns';
import 'chartjs-adapter-date-fns';
const count = ref(0)
const displayCount = ref(0)
Chart.register(...registerables);

const projects = ref([
  { id: 1, name: 'Project A', tasks: [{ completed: true }, { completed: false }] },
  { id: 2, name: 'Project B', tasks: [{ completed: true }, { completed: true }] },
  // Add more projects as needed
]);

onMounted(async ()=>{
  const data = await $fetch('/api/project/count', {
    method: "POST"
  })
  count.value = data.count
  
  // Animate the counter
  const duration = 1000 // 1 second animation
  const start = 0
  const end = count.value
  const startTime = performance.now()
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    displayCount.value = Math.floor(start + (end - start) * progress)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
})

const totalProjects = computed(() => displayCount.value);

const taskSummary = computed(() => {
  let completed = 0;
  let notCompleted = 0;
  let started = 0;

  projects.value.forEach(project => {
    project.tasks.forEach(task => {
      if (task.completed) {
        completed++;
      } else if (task.started) {
        started++;
      } else {
        notCompleted++;
      }
    });
  });

  return { completed, notCompleted, started };
});

const tasksChart = ref(null);
const timelineChart = ref(null);
const timeRange = ref('week');
let tasksChartInstance = null;  // Add this line to track the tasks chart instance
let timelineChartInstance = null;  // Add this line to track the timeline chart instance

const updateTasksChart = () => {
  const ctx = document.getElementById('tasksChart').getContext('2d');
  
  // Destroy existing chart instance if it exists
  if (tasksChartInstance) {
    tasksChartInstance.destroy();
  }

  tasksChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Pending'],
      datasets: [{
        data: [
          stats.value.taskStats?.completed_tasks || 0,
          stats.value.taskStats?.pending_tasks || 0
        ],
        backgroundColor: ['#4CAF50', '#F44336'],
        borderColor: ['#388E3C', '#D32F2F'],
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
};

const stats = ref({
  taskStats: null,
  priorityDistribution: [],
  timeline: []
});

const filters = ref({
  type: 'all',
  priority: 'all',
  completion: 'all'
});

onMounted(async () => {
  // Fetch stats
  try {
    const response = await $fetch('/api/stats/info', {
      method: 'POST'
    });
    stats.value = response;
    
    // Update chart with new data
    updateTasksChart();
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
});

const getTimelineItemColor = (item) => {
  if (item.type === 'milestone') return 'bg-blue-500';
  if (item.completed) return 'bg-green-500';
  return 'bg-yellow-500';
};

const getPriorityClass = (priority) => {
  const classes = {
    'high': 'bg-red-100 text-red-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-blue-100 text-blue-800',
    undefined: 'bg-blue-100 text-blue-800' // for milestones
  };
  return classes[priority?.toLowerCase()] || classes.undefined;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Group timeline items by date
const groupedTimeline = computed(() => {
  return stats.value.timeline.reduce((acc, item) => {
    const date = format(new Date(item.date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});
});

// Format date headers
const formatDateHeader = (date) => {
  return format(parseISO(date), 'EEEE, MMMM d, yyyy');
};

// Get styles for timeline items
const getItemStyles = (item) => {
  if (item.type === 'milestone') {
    return {
      'border-blue-500': true,
      'bg-blue-50': true
    };
  }
  
  if (item.completed) {
    return {
      'border-green-500': true
    };
  }
  
  return {
    'border-yellow-500': true
  };
};

// Add these helper functions at the script setup level
const getDateRange = (range) => {
  const now = new Date();
  switch (range) {
    case 'week':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now)
      };
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31)
      };
    default:
      return {
        start: startOfWeek(now),
        end: endOfWeek(now)
      };
  }
};

// Replace the updateTimelineChart function
const updateTimelineChart = () => {
  if (!timelineChart.value) return;
  const ctx = timelineChart.value.getContext('2d');
  
  if (timelineChartInstance) {
    timelineChartInstance.destroy();
  }

  const { start, end } = getDateRange(timeRange.value);

  // Transform timeline data into Gantt format
  const ganttData = stats.value.timeline.map((item, index) => ({
    y: timeRange.value === 'month' ? 
       format(new Date(item.date), 'dd') : // Show only day number for month view
       format(new Date(item.date), 'MMM dd'), // Show month and day for other views
    x: [new Date(item.date), // start date
        // For demo, set end date to 2-5 days after start
        new Date(new Date(item.date).setDate(
          new Date(item.date).getDate() + Math.floor(Math.random() * 3) + 2
        ))
    ],
    type: item.type,
    completed: item.completed,
    name: item.name // Store original name for tooltip
  }));

  timelineChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [{
        data: ganttData,
        backgroundColor: (context) => {
          const item = ganttData[context.dataIndex];
          if (item.type === 'milestone') return '#3B82F6';
          return item.completed ? '#10B981' : '#F59E0B';
        },
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            title: (context) => {
              const item = ganttData[context[0].dataIndex];
              return item.name; // Use original name in tooltip
            },
            label: (context) => {
              const item = ganttData[context.dataIndex];
              return [
                `Type: ${item.type}`,
                `Status: ${item.completed ? 'Completed' : 'In Progress'}`,
                `Start: ${format(item.x[0], 'MMM d, yyyy')}`,
                `End: ${format(item.x[1], 'MMM d, yyyy')}`
              ];
            }
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          type: 'time',
          position: 'top', // Move time scale to top
          time: {
            unit: timeRange.value === 'year' ? 'month' : 'day',
            displayFormats: {
              day: 'MMM d',
              month: 'MMM yyyy'
            },
            tooltipFormat: 'MMM d, yyyy'
          },
          min: format(start, 'yyyy-MM-dd'),
          max: format(end, 'yyyy-MM-dd'),
          grid: {
            color: '#f3f4f6',
            drawBorder: false
          }
        },
        y: {
          display: false, // Hide y-axis completely
          beginAtZero: true,
          grid: {
            display: false
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 20,
          bottom: 10
        }
      }
    }
  });
};

// Modify the stats watcher
watch([stats, timeRange], () => {
  if (stats.value.timeline.length > 0) {
    nextTick(() => {
      updateTimelineChart();
    });
  }
}, { deep: true });

onMounted(async () => {
  try {
    // Fetch project count
    const data = await $fetch('/api/project/count', {
      method: "POST"
    });
    count.value = data.count;
    
    // Animate counter
    const duration = 1000;
    const start = 0;
    const end = count.value;
    const startTime = performance.now();
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      displayCount.value = Math.floor(start + (end - start) * progress);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);

    // Fetch stats
    const response = await $fetch('/api/stats/info', {
      method: 'POST'
    });
    stats.value = response;
    console.log(stats.value)
    
    // Update charts after data is loaded
    nextTick(() => {
      updateTasksChart();
      updateTimelineChart();
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

// Clean up charts on component unmount
onUnmounted(() => {
  if (tasksChartInstance) {
    tasksChartInstance.destroy();
  }
  if (timelineChartInstance) {
    timelineChartInstance.destroy();
  }
});

// Watch for time range changes
watch(timeRange, () => {
  updateTimelineChart();
});

</script>

<style scoped>
.circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border: 5px solid #4CAF50;
  border-radius: 50%;
  margin: 0 auto;
}
.chart-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}
#tasksChart {
  width: 100%;
  height: 100%;
}
.chart-legend {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.chart-legend ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.chart-legend li {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 2px;
}

.timeline-item {
  transition: all 0.2s ease;
}

.timeline-item:hover {
  transform: translateX(4px);
}

/* Update the timeline chart container styles */
.relative.h-96 {
  height: 400px; /* or adjust as needed */
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>


