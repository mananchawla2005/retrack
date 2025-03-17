<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-6">My Tasks & Milestones</h2>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- To Do Column -->
      <div 
        class="bg-blue-50 rounded-lg p-4" 
        @dragover.prevent
        @drop.prevent="handleDrop('todo')"
        :class="{ 'border-2 border-dashed border-blue-500': isDraggingOver === 'todo' }"
      >
        <h3 class="text-lg font-semibold text-blue-700 mb-3">To Do</h3>
        <div class="space-y-3">
          <div 
            v-for="item in categories.todo" 
            :key="item.id"
            :class="[
              'p-3 rounded-lg shadow-sm transition duration-200',
              item.type === 'task' ? 'bg-blue-100 border-l-4 border-blue-500' : 'bg-purple-100 border-l-4 border-purple-500',
              { 'opacity-50': draggingItem?.id === item.id },
              { 'hover:scale-102 cursor-move': true }
            ]"
            draggable="true"
            @dragstart="handleDragStart(item, 'todo')"
            @dragend="handleDragEnd"
          >
            <div class="flex justify-between items-start">
              <span :class="item.type === 'task' ? 'text-blue-800' : 'text-purple-800'" class="text-xs font-semibold uppercase">{{ item.type }}</span>
              <span 
                :class="[
                  'text-xs px-2 py-0.5 rounded-full', 
                  item.priority === 'high' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
                ]"
              >{{ formatDate(item.dueDate) }}</span>
            </div>
            <h4 class="font-medium mt-1">{{ item.title }}</h4>
            <div class="flex items-center mt-2">
              <span class="text-xs text-gray-600">Project: {{ item.projectName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- In Progress Column -->
      <div 
        class="bg-amber-50 rounded-lg p-4"
        @dragover.prevent
        @drop.prevent="handleDrop('inprogress')"
        :class="{ 'border-2 border-dashed border-amber-500': isDraggingOver === 'inprogress' }"
      >
        <h3 class="text-lg font-semibold text-amber-700 mb-3">In Progress</h3>
        <div class="space-y-3">
          <div 
            v-for="item in categories.inprogress" 
            :key="item.id"
            :class="[
              'p-3 rounded-lg shadow-sm transition duration-200',
              item.type === 'task' ? 'bg-amber-100 border-l-4 border-amber-500' : 'bg-purple-100 border-l-4 border-purple-500',
              { 'opacity-50': draggingItem?.id === item.id },
              { 'hover:scale-102 cursor-move': true }
            ]"
            draggable="true"
            @dragstart="handleDragStart(item, 'inprogress')"
            @dragend="handleDragEnd"
          >
            <div class="flex justify-between items-start">
              <span :class="item.type === 'task' ? 'text-amber-800' : 'text-purple-800'" class="text-xs font-semibold uppercase">{{ item.type }}</span>
              <span 
                :class="[
                  'text-xs px-2 py-0.5 rounded-full', 
                  item.priority === 'high' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                ]"
              >{{ formatDate(item.dueDate) }}</span>
            </div>
            <h4 class="font-medium mt-1">{{ item.title }}</h4>
            <div class="flex items-center mt-2">
              <span class="text-xs text-gray-600">Project: {{ item.projectName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Done Column -->
      <div 
        class="bg-green-50 rounded-lg p-4"
        @dragover.prevent
        @drop.prevent="handleDrop('done')"
        :class="{ 'border-2 border-dashed border-green-500': isDraggingOver === 'done' }"
      >
        <h3 class="text-lg font-semibold text-green-700 mb-3">Done</h3>
        <div class="space-y-3">
          <div 
            v-for="item in categories.done" 
            :key="item.id"
            :class="[
              'p-3 rounded-lg shadow-sm transition duration-200',
              item.type === 'task' ? 'bg-green-100 border-l-4 border-green-500' : 'bg-purple-100 border-l-4 border-purple-500',
              { 'opacity-50': draggingItem?.id === item.id },
              { 'hover:scale-102 cursor-move': true }
            ]"
            draggable="true"
            @dragstart="handleDragStart(item, 'done')"
            @dragend="handleDragEnd"
          >
            <div class="flex justify-between items-start">
              <span :class="item.type === 'task' ? 'text-green-800' : 'text-purple-800'" class="text-xs font-semibold uppercase">{{ item.type }}</span>
              <span 
                :class="[
                  'text-xs px-2 py-0.5 rounded-full', 
                  item.priority === 'high' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                ]"
              >{{ formatDate(item.dueDate) }}</span>
            </div>
            <h4 class="font-medium mt-1">{{ item.title }}</h4>
            <div class="flex items-center mt-2">
              <span class="text-xs text-gray-600">Project: {{ item.projectName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from '~/stores/taskStore';

const taskStore = useTaskStore();
const isLoading = ref(true);
const draggingItem = ref(null);
const sourceCategory = ref(null);
const isDraggingOver = ref(null);

onMounted(async () => {
  await taskStore.fetchTasks();
  isLoading.value = false;
});

const categories = computed(() => {
  const items = [...taskStore.tasks, ...taskStore.milestones];
  
  return {
    todo: items.filter(item => item.status === 'todo' || !item.status),
    inprogress: items.filter(item => item.status === 'inprogress'),
    done: items.filter(item => item.status === 'done')
  };
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function handleDragStart(item, category) {
  draggingItem.value = item;
  sourceCategory.value = category;
}

function handleDragEnd() {
  draggingItem.value = null;
  sourceCategory.value = null;
  isDraggingOver.value = null;
}

function handleDragOver(category) {
  if (sourceCategory.value !== category) {
    isDraggingOver.value = category;
  }
}

function handleDrop(targetCategory) {
  if (!draggingItem.value || sourceCategory.value === targetCategory) {
    isDraggingOver.value = null;
    return;
  }
  
  // Update only the status, not the due date
  const itemToUpdate = { 
    ...draggingItem.value, 
    status: targetCategory 
  };
  
  if (itemToUpdate.type === 'task') {
    if (typeof taskStore.updateTask === 'function') {
      taskStore.updateTask(itemToUpdate);
    } else {
      console.error('taskStore.updateTask is not defined.');
    }
  } else if (itemToUpdate.type === 'milestone') {
    if (typeof taskStore.updateMilestone === 'function') {
      taskStore.updateMilestone(itemToUpdate);
    } else if (typeof taskStore.updateTask === 'function') {
      console.warn('taskStore.updateMilestone is not defined. Using updateTask instead.');
      taskStore.updateTask(itemToUpdate);
    } else {
      console.error('Neither updateMilestone nor updateTask are defined in taskStore.');
    }
  }
  
  isDraggingOver.value = null;
  draggingItem.value = null;
  sourceCategory.value = null;
}
</script>

<style scoped>
.hover\:scale-102:hover {
  transform: scale(1.02);
}
</style>
