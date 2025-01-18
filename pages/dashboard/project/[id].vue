<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">{{ project.title }}</h1>
    <p class="text-lg text-gray-600 mb-4">{{ project.description }}</p>
    <p class="text-md text-gray-500 mb-4">Created on: {{ project.createdAt }}</p>
    <div class="bg-gray-100 p-4 rounded-lg mb-4 inline-flex items-center space-x-3">
      <span class="text-sm text-gray-600">Invite Code:</span>
      <span class="font-mono bg-white px-3 py-1 rounded border">{{ project.inviteCode }}</span>
      <button 
        @click="copyInviteCode" 
        class="text-blue-500 hover:text-blue-700"
        :class="{ 'text-green-500': copied }"
      >
        <span v-if="!copied">Copy</span>
        <span v-else>Copied!</span>
      </button>
    </div>
    <div class="flex space-x-2 mb-6">
      <span v-for="tag in project.tags" :key="tag" class="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">{{ tag
        }}</span>
    </div>

    <div class="relative">
      <div class="absolute left-1/2 transform -translate-x-1/2 h-full border-l-4 border-gray-300"></div>
      <div v-for="(milestone, index) in milestones" :key="index" class="mb-12">
        <!-- Tasks Section -->
        <div v-if="milestone.tasks && milestone.tasks.length > 0" v-for="(task, taskIndex) in milestone.tasks"
          :key="`${index}-${taskIndex}`" class="relative mb-8 group">
          <TaskCard :task="task" />
        </div>

        <!-- Milestone Section -->
        <MilestoneCard :milestone="milestone" @edit="editMilestone(index)" @delete="confirmDeleteMilestone(index)" />
      </div>

      <!-- Add Milestone Button -->
      <div class="relative mb-12">
        <div
          class="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-4 border-gray-300 rounded-full w-10 h-10 flex items-center justify-center">
          <button @click="openAddMilestoneCard" class="text-blue-500 text-lg">+</button>
        </div>
        <div class="ml-16 pl-4">
          <p class="text-lg text-gray-500">Add a milestone</p>
        </div>
      </div>
    </div>

    <AddMilestoneCard v-if="showAddMilestoneCard" :isLoading="isLoading"
      :milestone="editingMilestoneIndex !== null ? milestones[editingMilestoneIndex] : null" @save="saveMilestone"
      @cancel="cancelEdit" />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-xl font-bold mb-4">Are you sure you want to delete this milestone?</h2>
        <p class="text-gray-700 mb-4">All tasks created under this milestone will be deleted too.</p>
        <div class="flex justify-end">
          <div v-if="isDeleteLoading" class="spinner mr-2 self-center"></div>
          <button @click="cancelDelete" class="text-gray-500 mr-4">Cancel</button>
          <button @click="deleteMilestone" class="bg-red-500 text-white px-4 py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const project = ref({});
const copied = ref(false);
const milestones = ref([]);
const showAddMilestoneCard = ref(false);
const editingMilestoneIndex = ref(null);
const showDeleteConfirmation = ref(false);
const milestoneToDeleteIndex = ref(null);
const isLoading = ref(false)
const isDeleteLoading = ref(false)

const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(project.value.inviteCode);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
// Computed property to combine and sort milestones and tasks
const sortedTimelineItems = computed(() => {
  let items = [];

  // Add milestones
  milestones.value.forEach((milestone, index) => {
    items.push({
      type: 'milestone',
      date: new Date(milestone.deadline),
      data: milestone,
      index: index
    });

    // Add tasks for this milestone
    if (milestone.tasks) {
      milestone.tasks.forEach(task => {
        items.push({
          type: 'task',
          date: new Date(task.deadline),
          data: task,
          milestoneIndex: index
        });
      });
    }
  });

  // Sort items by date
  return items.sort((a, b) => a.date - b.date);
});

onMounted(async () => {
  const projectId = route.params.id
  const data = await $fetch('/api/project/info', {
    method: "POST",
    body: {
      projectId: projectId
    }
  })
  // Fetch the project details based on the projectId
  project.value = {
    id: projectId,
    title: `Project ${data.projectName}`,
    description: `Description of project ${data.description}`,
    createdAt: data.createdOn,
    tags: data.keywords,
    inviteCode: data.inviteCode
  };
  const milestoneData = await $fetch('/api/milestone/info', {
    method: "POST",
    body: {
      projectId: projectId
    }
  })
  milestones.value = milestoneData.milestones
});

const openAddMilestoneCard = () => {
  editingMilestoneIndex.value = null;
  showAddMilestoneCard.value = true;
};

const saveMilestone = async (milestone) => {
  if (editingMilestoneIndex.value !== null) {
    isLoading.value = true
    console.log("SAVE EMITTED")
    const result = await $fetch('/api/milestone/update', {
      method: "POST",
      body: milestone
    })
    var count = 0
    for(const task of milestone.tasks){
      if(!task.id){
        task.id = result.taskIds[count]
        count+=1
      }
    }
    isLoading.value = false

    milestones.value[editingMilestoneIndex.value] = milestone;
  } else {
    isLoading.value = true
    const result = await $fetch('/api/milestone/new', {
      method: "POST",
      body: {
        name: milestone.name,
        deadline: milestone.deadline,
        projectId: route.params.id,
        tasks: milestone.tasks
      }
    })
    milestone.id = result.milestoneId
    for (let index = 0; index < milestone.tasks; index++) {
      const element = milestone[index];
      element.id = result.taskIds[index]
      
    }
    isLoading.value = false
    milestones.value.push(milestone);
  }
  showAddMilestoneCard.value = false;
  editingMilestoneIndex.value = null;
};

const confirmDeleteMilestone = (index) => {
  milestoneToDeleteIndex.value = index;
  showDeleteConfirmation.value = true;
};

const deleteMilestone = async () => {
  if (milestoneToDeleteIndex.value !== null) {
    const milestone = milestones.value.splice(milestoneToDeleteIndex.value, 1);
    isDeleteLoading.value = true
    await $fetch('/api/milestone/delete', {
      method: "POST",
      body: {
        id: milestone[0].id
      }
    })
    isDeleteLoading.value = false
    milestoneToDeleteIndex.value = null;
    showDeleteConfirmation.value = false;
  }
};

const cancelDelete = () => {
  milestoneToDeleteIndex.value = null;
  showDeleteConfirmation.value = false;
};

const editMilestone = (index) => {
  editingMilestoneIndex.value = index;
  showAddMilestoneCard.value = true;
};

const cancelEdit = () => {
  editingMilestoneIndex.value = null;
  showAddMilestoneCard.value = false;
};
</script>
<style scoped>
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