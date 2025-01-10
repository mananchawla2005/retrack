<template>

    <div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-2 bg-white rounded shadow flex items-center justify-center">
            <div class="text-center">
              <h2 class="text-md font-semibold">Total Projects</h2>
              <div class="circle">
                <p class="text-2xl font-bold">{{ totalProjects }}</p>
              </div>
            </div>
          </div>
          <div class="p-2 bg-white rounded shadow flex flex-col items-center">
            <h2 class="text-md font-semibold text-center mb-2">Tasks Overview</h2>
            <div class="flex items-center">
              <div class="chart-container">
                <canvas id="tasksChart"></canvas>
              </div>
              <div class="chart-legend ml-2">
                <ul>
                  <li><span class="legend-color" style="background-color: #4CAF50;"></span> Completed</li>
                  <li><span class="legend-color" style="background-color: #F44336;"></span> Not Completed</li>
                  <li><span class="legend-color" style="background-color: #FFEB3B;"></span> Started</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import DashboardNavbar from '@/components/DashboardNavbar.vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const projects = ref([
  { id: 1, name: 'Project A', tasks: [{ completed: true }, { completed: false }] },
  { id: 2, name: 'Project B', tasks: [{ completed: true }, { completed: true }] },
  // Add more projects as needed
]);

const totalProjects = computed(() => projects.value.length);

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

onMounted(() => {
  const tasksChartCtx = document.getElementById('tasksChart').getContext('2d');
  new Chart(tasksChartCtx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Not Completed', 'Started'],
      datasets: [{
        data: [taskSummary.value.completed, taskSummary.value.notCompleted, taskSummary.value.started],
        backgroundColor: ['#4CAF50', '#F44336', '#FFEB3B'],
        borderColor: ['#388E3C', '#D32F2F', '#FBC02D'],
        borderWidth: 2,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: '#fff',
          bodyColor: '#fff',
          bodyFont: {
            size: 14,
          },
          padding: 10,
        }
      }
    }
  });
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
</style>


