<template>
  <div class="flex h-screen bg-gray-100">
    <Sidebar />
    <div class="flex-1 flex flex-col">
      <DashboardNavbar />
      <main class="flex-1 p-6">
                <div>
          <NuxtPage/>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import DashboardNavbar from '@/components/DashboardNavbar.vue';
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