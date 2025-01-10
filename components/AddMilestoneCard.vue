<template>
    <div class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-xl font-bold mb-4">{{ milestone ? 'Edit Milestone' : 'Add Milestone' }}</h2>
        <div class="mb-4">
          <label class="block text-gray-700">Milestone Name</label>
          <input v-model="milestoneName" type="text" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Deadline</label>
          <input v-model="milestoneDeadline" type="date" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Tasks</h3>
          <div class="max-h-64 overflow-y-auto custom-scrollbar">
            <div v-for="(task, index) in tasks" :key="index" class="mb-4">
              <div v-if="task.editMode">
                <input v-model="task.name" type="text" placeholder="Task Name" class="w-full px-3 py-2 border rounded-lg mb-2" />
                <input v-model="task.deadline" type="date" class="w-full px-3 py-2 border rounded-lg mb-2" />
                <input v-model="task.assignedTo" type="text" placeholder="Assign to" class="w-full px-3 py-2 border rounded-lg mb-2" />
                <div class="flex items-center space-x-2">
                  <div @click="setTaskPriority(index, 'must')" :class="['px-2 py-1 text-xs rounded-full cursor-pointer', task.priority === 'must' ? 'ring-2 ring-red-500' : '']" style="background-color: red;">Must</div>
                  <div @click="setTaskPriority(index, 'can')" :class="['px-2 py-1 text-xs rounded-full cursor-pointer', task.priority === 'can' ? 'ring-2 ring-purple-500' : '']" style="background-color: purple;">Can</div>
                  <div @click="setTaskPriority(index, 'maybe')" :class="['px-2 py-1 text-xs rounded-full cursor-pointer', task.priority === 'maybe' ? 'ring-2 ring-gray-500' : '']" style="background-color: gray;">Maybe</div>
                  <div v-for="(label, labelIndex) in customLabels" :key="labelIndex" @click="setTaskPriority(index, label.name)" :class="['px-2 py-1 text-xs rounded-full cursor-pointer', task.priority === label.name ? 'ring-2' : '']" :style="{ backgroundColor: label.color }">{{ label.name }}</div>
                  <div @click="openCustomLabelDialog" class="px-2 py-1 text-xs rounded-full cursor-pointer bg-blue-500 text-white">+ Custom</div>
                </div>
                <button @click="toggleTaskEditMode(index)" class="text-blue-500 mt-2">Save Task</button>
              </div>
              <div v-else class="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <p class="text-lg font-semibold">{{ task.name }}</p>
                  <p class="text-sm text-gray-500">Priority: {{ task.priority }}</p>
                  <p class="text-sm text-gray-500">Deadline: {{ task.deadline }}</p>
                  <p v-if="task.assignedTo" class="text-sm text-gray-500">Assigned to: {{ task.assignedTo }}</p>
                </div>
                <div class="flex space-x-2">
                  <button @click="toggleTaskEditMode(index)" class="text-blue-500">Edit Task</button>
                  <button @click="deleteTask(index)" class="text-red-500">Delete Task</button>
                </div>
              </div>
            </div>
          </div>
          <button @click="addTask" class="text-blue-500">+ Add Task</button>
        </div>
        <div class="flex justify-end">
          <button @click="cancel" class="text-gray-500 mr-4">Cancel</button>
          <button @click="save" class="bg-blue-500 text-white px-4 py-2 rounded-lg">Save</button>
        </div>
      </div>
    </div>
  
    <div v-if="showCustomLabelDialog" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-xl font-bold mb-4">Add Custom Label</h2>
        <div class="mb-4">
          <label class="block text-gray-700">Label Name</label>
          <input v-model="customLabelName" type="text" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Label Color</label>
          <input v-model="customLabelColor" type="color" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div class="flex justify-end">
          <button @click="closeCustomLabelDialog" class="text-gray-500 mr-4">Cancel</button>
          <button @click="addCustomLabel" class="bg-blue-500 text-white px-4 py-2 rounded-lg">Add</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    milestone: {
      type: Object,
      default: () => null
    }
  });
  const emit = defineEmits(['save', 'cancel']);
  
  const milestoneName = ref('');
  const milestoneDeadline = ref('');
  const tasks = ref([{ name: '', deadline: '', assignedTo: '', priority: 'medium', editMode: true }]);
  const showCustomLabelDialog = ref(false);
  const customLabelName = ref('');
  const customLabelColor = ref('#000000');
  const customLabels = ref([]);
  
  const resetForm = () => {
    milestoneName.value = '';
    milestoneDeadline.value = '';
    tasks.value = [{ name: '', deadline: '', assignedTo: '', priority: 'medium', editMode: true }];
  };
  
  watch(() => props.milestone, (newMilestone) => {
    if (newMilestone) {
      milestoneName.value = newMilestone.name || '';
      milestoneDeadline.value = newMilestone.deadline || '';
      tasks.value = newMilestone.tasks.length ? newMilestone.tasks.map(task => ({ ...task, editMode: false })) : [{ name: '', deadline: '', assignedTo: '', priority: 'medium', editMode: true }];
    } else {
      resetForm();
    }
  }, { immediate: true });
  
  const addTask = () => {
    tasks.value.push({ name: '', deadline: '', assignedTo: '', priority: 'medium', editMode: true });
  };
  
  const toggleTaskEditMode = (index) => {
    tasks.value[index].editMode = !tasks.value[index].editMode;
  };
  
  const setTaskPriority = (taskIndex, priority) => {
    tasks.value[taskIndex].priority = priority;
  };
  
  const save = () => {
    const filteredTasks = tasks.value.filter(task => task.name);
    emit('save', {
      name: milestoneName.value,
      deadline: milestoneDeadline.value,
      tasks: filteredTasks
    });
    resetForm();
  };
  
  const cancel = () => {
    emit('cancel');
    resetForm();
  };
  
  const openCustomLabelDialog = () => {
    showCustomLabelDialog.value = true;
  };
  
  const closeCustomLabelDialog = () => {
    showCustomLabelDialog.value = false;
    customLabelName.value = '';
    customLabelColor.value = '#000000';
  };
  
  const addCustomLabel = () => {
    if (customLabelName.value && customLabelColor.value) {
      customLabels.value.push({ name: customLabelName.value, color: customLabelColor.value });
      showCustomLabelDialog.value = false;
      customLabelName.value = '';
      customLabelColor.value = '#000000';
    }
  };
  
  const deleteTask = (index) => {
    tasks.value.splice(index, 1);
  };
  </script>
  
  <style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #a0aec0; /* Gray color */
    border-radius: 10px;
    border: 2px solid transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #718096; /* Darker gray color */
  }
  </style>