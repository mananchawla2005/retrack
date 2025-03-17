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
              <input v-model="task.name" type="text" placeholder="Task Name"
                class="w-full px-3 py-2 border rounded-lg mb-2" />
              <input v-model="task.deadline" type="date" class="w-full px-3 py-2 border rounded-lg mb-2" />
              <!-- <input v-model="task.assignedTo" type="text" placeholder="Assign to"
                class="w-full px-3 py-2 border rounded-lg mb-2" /> -->
              <div class="relative mb-2">
                <div class="flex flex-wrap gap-2 p-2 border rounded-lg">
                  <!-- Selected members bubbles -->
                  <div v-for="member in task.assignedTo" :key="member" 
                      class="bg-blue-100 px-2 py-1 rounded-full flex items-center">
                    <span>{{ userIdsMapping[member] }}</span>
                    <button @click="removeAssignee(index, member)" 
                            class="ml-1 text-blue-500 hover:text-blue-700">×</button>
                  </div>
                  
                  <!-- Dropdown input -->
                  <input v-model="assigneeSearch[index]" 
                        @focus="showDropdown[index] = true"
                        type="text" 
                        placeholder="Assign to members..."
                        class="flex-1 outline-none border-none" />
                </div>

                <!-- Dropdown list -->
                <div v-if="showDropdown[index]" 
                    class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                  <div v-for="member in filteredMembers(index)" 
                      :key="member"
                      @click="addAssignee(index, member)"
                      class="p-2 hover:bg-gray-100 cursor-pointer">
                    {{ userIdsMapping[member] }}
                  </div>
              </div>
            </div>
              <!-- Literature selection dropdown -->
              <div class="relative mb-2">
                <div class="flex flex-wrap gap-2 p-2 border rounded-lg">
                  <!-- Selected literature bubbles -->
                  <div v-for="paper in task.literature" :key="paper.id" 
                      class="bg-indigo-100 px-2 py-1 rounded-full flex items-center">
                    <span class="truncate max-w-[150px]">{{ paper.title }}</span>
                    <button @click="removeLiterature(index, paper.id)" 
                            class="ml-1 text-indigo-500 hover:text-indigo-700">×</button>
                  </div>
                  
                  <!-- Dropdown input -->
                  <input v-model="literatureSearch[index]" 
                         @focus="showLiteratureDropdown[index] = true"
                         type="text" 
                         placeholder="Link literature..."
                         class="flex-1 outline-none border-none" />
                </div>

                <!-- Literature dropdown list -->
                <div v-if="showLiteratureDropdown[index]" 
                     class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                  <div v-for="paper in filteredLiterature(index)" 
                       :key="paper.id"
                       @click="addLiterature(index, paper)"
                       class="p-2 hover:bg-gray-100 cursor-pointer truncate">
                    {{ paper.title }}
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <div @click="setTaskPriority(index, 'must')"
                  :class="['px-2 py-1 text-xs rounded-full cursor-pointer', task.priority === 'must' ? 'ring-2 ring-red-500' : '']"
                  style="background-color: red;">Must</div>
                <div @click="setTaskPriority(index, 'can')"
                  :class="['px-2 py-1 text-xs rounded-full cursor-pointer', task.priority === 'can' ? 'ring-2 ring-purple-500' : '']"
                  style="background-color: purple;">Can</div>
                <div @click="setTaskPriority(index, 'maybe')"
                  :class="['px-2 py-1 text-xs rounded-full cursor-pointer', task.priority === 'maybe' ? 'ring-2 ring-gray-500' : '']"
                  style="background-color: gray;">Maybe</div>
                <div v-for="(label, labelIndex) in customLabels" :key="labelIndex"
                  @click="setTaskPriority(index, label.name)"
                  :class="['px-2 py-1 text-xs rounded-full cursor-pointer', task.priority === label.name ? 'ring-2' : '']"
                  :style="{ backgroundColor: label.color }">{{ label.name }}</div>
                <div @click="openCustomLabelDialog"
                  class="px-2 py-1 text-xs rounded-full cursor-pointer bg-blue-500 text-white">+ Custom</div>
              </div>
              <button @click="toggleTaskEditMode(index)" class="text-blue-500 mt-2">Save Task</button>
            </div>
            <div v-else class="p-4 border rounded-lg flex justify-between items-center">
              <div>
                <p class="text-lg font-semibold">{{ task.name }}</p>
                <p class="text-sm text-gray-500">Priority: {{ task.priority }}</p>
                <p class="text-sm text-gray-500">Deadline: {{ task.deadline }}</p>
                <div class="flex items-center gap-1">
                  <span class="text-sm text-gray-500">Assigned to:</span>
                  <div class="flex -space-x-2">
                    <template v-for="userId in task.assignedTo" :key="userId">
                      <div class="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                        <span class="text-xs text-white font-medium">{{ userIdsMapping[userId] ? getInitials(userIdsMapping[userId]) : '...' }}</span>
                      </div>
                    </template>
                  </div>
                </div>
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
        <div v-if="localLoading" class="spinner mr-2 self-center"></div>
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
  },
  isLoading: {
    type: Boolean,
    default: () => false
  }
});
const emit = defineEmits(['save', 'cancel']);
const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
};
const milestoneName = ref('');
const milestoneId = ref('')
const milestoneDeadline = ref('');
const tasks = ref([{ id: '', name: '', deadline: '', assignedTo: [], priority: 'medium', editMode: true }]);
const showCustomLabelDialog = ref(false);
const customLabelName = ref('');
const customLabelColor = ref('#000000');
const customLabels = ref([]);
const localLoading = ref(false);
const assigneeSearch = ref({});
const showDropdown = ref({});
const teamMembers = ref([]);
const userIdsMapping = ref({});
const literatureSearch = ref({});
const showLiteratureDropdown = ref({});
const availableLiterature = ref([]);
const filteredMembers = (taskIndex) => {
  const search = assigneeSearch[taskIndex]?.toLowerCase() || '';
  return teamMembers.value.filter(member => 
  userIdsMapping.value[member].toLowerCase().includes(search) && 
    !tasks.value[taskIndex].assignedTo.includes(member)
  );
};
const addAssignee = (taskIndex, member) => {
  if (!tasks.value[taskIndex].assignedTo.includes(member)) {
    tasks.value[taskIndex].assignedTo.push(member);
    
  }
  assigneeSearch.value[taskIndex] = '';
  showDropdown.value[taskIndex] = false;
};

// Remove member from task
const removeAssignee = (taskIndex, member) => {
  tasks.value[taskIndex].assignedTo = tasks.value[taskIndex].assignedTo.filter(
    m => m !== member
  );
};

// Fetch literature on component mount
onMounted(async () => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      Object.keys(showDropdown.value).forEach(key => {
        showDropdown.value[key] = false;
      });
    }
  })
  const route = useRoute()
  const data = await $fetch('/api/project/assignees', {
    method: "POST",
    body: {
      projectId: route.params.id
    }
  })
  for(const d of data.users){
    teamMembers.value.push(d.user_id)
    userIdsMapping.value[d.user_id] = d.name
    
  }

  // Fetch literature
  const literatureData = await $fetch('/api/literature/info', {
    method: "POST",
    body: {
      projectId: route.params.id
    }
  });
  availableLiterature.value = literatureData;
});

// Filter literature based on search
const filteredLiterature = (taskIndex) => {
  const search = literatureSearch.value[taskIndex]?.toLowerCase() || '';
  const task = tasks.value[taskIndex];
  return availableLiterature.value.filter(paper => 
    paper.title.toLowerCase().includes(search) && 
    !task.literature?.some(p => p.id === paper.id)
  );
};

// Add literature to task
const addLiterature = (taskIndex, paper) => {
  if (!tasks.value[taskIndex].literature) {
    tasks.value[taskIndex].literature = [];
  }
  if (!tasks.value[taskIndex].literature.some(p => p.id === paper.id)) {
    tasks.value[taskIndex].literature.push(paper);
  }
  literatureSearch.value[taskIndex] = '';
  showLiteratureDropdown.value[taskIndex] = false;
};

// Remove literature from task
const removeLiterature = (taskIndex, paperId) => {
  tasks.value[taskIndex].literature = tasks.value[taskIndex].literature.filter(
    paper => paper.id !== paperId
  );
};

watch(() => props.isLoading, (newValue) => {
  localLoading.value = newValue;
  if (!newValue) {
    resetForm();
  }
});

const resetForm = () => {
  milestoneName.id = ''
  milestoneName.value = '';
  milestoneDeadline.value = '';
  tasks.value = [{ id: '', name: '', deadline: '', assignedTo: [], literature: [], priority: 'medium', completed: false, editMode: true }];
};

watch(() => props.milestone, (newMilestone) => {
  if (newMilestone) {
    milestoneId.value = newMilestone.id || ''
    milestoneName.value = newMilestone.name || '';
    milestoneDeadline.value = newMilestone.deadline || '';
    tasks.value = newMilestone.tasks.length ? newMilestone.tasks.map(task => ({ ...task, editMode: false })) : [{ id: '', name: '', deadline: '', assignedTo: [], literature: [], priority: 'medium', completed: false, editMode: true }];
  } else {
    resetForm();
  }
}, { immediate: true });

const addTask = () => {
  tasks.value.push({ 
    id: '', 
    name: '', 
    deadline: '', 
    assignedTo: [], 
    literature: [],
    priority: 'medium',
    completed: false, // Add this line
    editMode: true 
  });
};

const toggleTaskEditMode = (index) => {
  tasks.value[index].editMode = !tasks.value[index].editMode;
};

const setTaskPriority = (taskIndex, priority) => {
  tasks.value[taskIndex].priority = priority;
};

const save = () => {
  const filteredTasks = tasks.value.filter(task => task.name);
  localLoading.value = true;
  emit('save', {
    id: milestoneId.value,
    name: milestoneName.value,
    deadline: milestoneDeadline.value,
    tasks: filteredTasks
  });
  // resetForm();
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
  background-color: #a0aec0;
  /* Gray color */
  border-radius: 10px;
  border: 2px solid transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #718096;
  /* Darker gray color */
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid #f1f5f9;  /* Light gray base */
  border-top: 2.5px solid #334155;  /* Dark slate for contrast */
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 0 8px rgba(51, 65, 85, 0.1);
  animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>