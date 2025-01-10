<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">{{ project.title }}</h1>
    <p class="text-lg text-gray-600 mb-4">{{ project.description }}</p>
    <p class="text-md text-gray-500 mb-4">Created on: {{ project.createdAt }}</p>
    <div class="flex space-x-2 mb-6">
      <span v-for="tag in project.tags" :key="tag" class="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">{{ tag }}</span>
    </div>

    <div class="relative">
      <div class="absolute left-1/2 transform -translate-x-1/2 h-full border-l-4 border-gray-300"></div>
      <div v-for="(milestone, index) in milestones" :key="index" class="mb-12">
        <!-- Tasks Section -->
        <div v-if="milestone.tasks && milestone.tasks.length > 0" 
             v-for="(task, taskIndex) in milestone.tasks" 
             :key="`${index}-${taskIndex}`" 
             class="relative mb-8 group">
          <TaskCard :task="task" />
        </div>

        <!-- Milestone Section -->
        <MilestoneCard :milestone="milestone" @edit="editMilestone(index)" @delete="confirmDeleteMilestone(index)" />
      </div>

      <!-- Add Milestone Button -->
      <div class="relative mb-12">
        <div class="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-4 border-gray-300 rounded-full w-10 h-10 flex items-center justify-center">
          <button @click="openAddMilestoneCard" class="text-blue-500 text-lg">+</button>
        </div>
        <div class="ml-16 pl-4">
          <p class="text-lg text-gray-500">Add a milestone</p>
        </div>
      </div>
    </div>

    <AddMilestoneCard 
      v-if="showAddMilestoneCard" 
      :milestone="editingMilestoneIndex !== null ? milestones[editingMilestoneIndex] : null" 
      @save="saveMilestone" 
      @cancel="cancelEdit" 
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-xl font-bold mb-4">Are you sure you want to delete this milestone?</h2>
        <p class="text-gray-700 mb-4">All tasks created under this milestone will be deleted too.</p>
        <div class="flex justify-end">
          <button @click="cancelDelete" class="text-gray-500 mr-4">Cancel</button>
          <button @click="deleteMilestone" class="bg-red-500 text-white px-4 py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AddMilestoneCard from '~/components/AddMilestoneCard.vue';
import MilestoneCard from '~/components/MilestoneCard.vue';
import TaskCard from '~/components/TaskCard.vue';

const route = useRoute();
const project = ref({});
const milestones = ref([]);
const showAddMilestoneCard = ref(false);
const editingMilestoneIndex = ref(null);
const showDeleteConfirmation = ref(false);
const milestoneToDeleteIndex = ref(null);

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

onMounted(() => {
  const projectId = route.params.id;
  // Fetch the project details based on the projectId
  project.value = {
    id: projectId,
    title: `Project ${projectId}`,
    description: `Description of project ${projectId}`,
    createdAt: '2023-10-01',
    tags: ['Tag1', 'Tag2', 'Tag3']
  };
});

const openAddMilestoneCard = () => {
  editingMilestoneIndex.value = null;
  showAddMilestoneCard.value = true;
};

const saveMilestone = (milestone) => {
  if (editingMilestoneIndex.value !== null) {
    milestones.value[editingMilestoneIndex.value] = milestone;
  } else {
    milestones.value.push(milestone);
  }
  showAddMilestoneCard.value = false;
  editingMilestoneIndex.value = null;
};

const confirmDeleteMilestone = (index) => {
  milestoneToDeleteIndex.value = index;
  showDeleteConfirmation.value = true;
};

const deleteMilestone = () => {
  if (milestoneToDeleteIndex.value !== null) {
    milestones.value.splice(milestoneToDeleteIndex.value, 1);
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