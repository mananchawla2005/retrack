<template>
    <div class="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-center text-blue-700">Project Options</h2>
        <div v-if="!showCreateForm && !showJoinForm">
          <button @click="showCreateForm = true" class="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition font-semibold mb-4">
            Create New Project
          </button>
          <button @click="showJoinForm = true" class="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition font-semibold">
            Join Existing Project
          </button>
        </div>
        <div v-if="showCreateForm">
          <form @submit.prevent="submitProject">
            <div class="mb-4">
              <label for="projectName" class="block text-gray-700 font-semibold mb-2">Project Name <span class="text-red-500">*</span></label>
              <input
                type="text"
                id="projectName"
                v-model="projectName"
                :disabled="inviteCodeGenerated"
                class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                :class="{'border-red-500': projectNameError, 'bg-gray-200': inviteCodeGenerated}"
              />
              <p v-if="projectNameError" class="text-red-500 text-sm mt-1">Project name is required.</p>
            </div>
            <div class="mb-4">
              <label for="description" class="block text-gray-700 font-semibold mb-2">Description <span class="text-red-500">*</span></label>
              <textarea
                id="description"
                v-model="description"
                :disabled="inviteCodeGenerated"
                class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                :class="{'border-red-500': descriptionError, 'bg-gray-200': inviteCodeGenerated}"
              ></textarea>
              <p v-if="descriptionError" class="text-red-500 text-sm mt-1">Description is required.</p>
            </div>
            <div class="mb-4">
              <label for="keywords" class="block text-gray-700 font-semibold mb-2">Keywords <span class="text-red-500">*</span></label>
              <div class="flex flex-wrap items-center border rounded px-3 py-2 focus-within:ring focus-within:ring-blue-300 relative" :class="{'border-red-500': keywordsError, 'bg-gray-200': inviteCodeGenerated}">
                <div v-for="(keyword, index) in keywords" :key="index" class="bg-blue-200 text-blue-700 px-2 py-1 rounded-full mr-2 mb-2 flex items-center">
                  {{ keyword }}
                  <button @click="removeKeyword(index)" class="ml-2 text-red-500 hover:text-red-700" :disabled="inviteCodeGenerated">&times;</button>
                </div>
                <input
                  type="text"
                  v-model="keywordInput"
                  @focus="showDropdown = true"
                  @blur="hideDropdown"
                  @keydown.enter.prevent="addKeyword"
                  class="flex-grow border-none focus:outline-none"
                  :placeholder="keywords.length === 0 ? 'Type and press enter to add keywords' : ''"
                  :disabled="inviteCodeGenerated"
                />
                <ul v-if="showDropdown && filteredKeywords.length" class="absolute top-full left-0 w-full bg-white border rounded shadow-md mt-1 z-10 max-h-60 overflow-y-auto">
                  <li
                    v-for="(keyword, index) in filteredKeywords"
                    :key="index"
                    @mousedown.prevent="selectKeyword(keyword)"
                    class="px-3 py-2 cursor-pointer hover:bg-blue-100"
                  >
                    {{ keyword }}
                  </li>
                </ul>
              </div>
              <p v-if="keywordsError" class="text-red-500 text-sm mt-1">At least one keyword is required.</p>
            </div>
            <div class="flex justify-between">
              <button :disabled="inviteCodeGenerated" type="button" @click="createInviteCode" class="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition font-semibold">
                Create Invite Code
              </button>
              <NuxtLink :to="nextLink" class="bg-blue-700 block text-white py-2 px-4 rounded hover:bg-blue-800 transition font-semibold">
                Submit
              </NuxtLink>
            </div>
          </form>
          <div v-if="inviteCode" class="mt-4 text-center">
            <p class="text-gray-700">Invite Code:</p>
            <div class="flex items-center justify-center mt-2">
              <span class="bg-yellow-200 text-yellow-800 px-3 py-1 rounded font-mono">{{ inviteCode }}</span>
              <button @click="copyInviteCode" class="ml-2 bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition">
                Copy
              </button>
            </div>
          </div>
        </div>
        <div v-if="showJoinForm">
          <form @submit.prevent="joinProject">
            <div class="mb-4">
              <label for="inviteCode" class="block text-gray-700 font-semibold mb-2">Invite Code</label>
              <input
                type="text"
                id="inviteCode"
                v-model="inviteCodeInput"
                class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>
            <button type="submit" class="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition font-semibold">
              Join Project
            </button>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="js" setup>
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  
  definePageMeta({
	middleware: ["protected"]
});
  const showCreateForm = ref(false);
  const showJoinForm = ref(false);
  const projectName = ref('');
  const description = ref('');
  const keywords = ref([]);
  const keywordInput = ref('');
  const inviteCode = ref('');
  const inviteCodeInput = ref('');
  const showDropdown = ref(false);
  const inviteCodeGenerated = ref(false);
  const nextLink = ref('/dashboard')
  const projectNameError = ref(false);
  const descriptionError = ref(false);
  const keywordsError = ref(false);
  
  const availableKeywords = [
    'Artificial Intelligence (AI)', 'Machine Learning (ML)', 'Deep Learning', 'Computer Vision', 'Natural Language Processing (NLP)',
    'Robotics', 'Data Science', 'Big Data', 'Statistics', 'Mathematics', 'Physics', 'Quantum Computing', 'Optimization', 'Algorithms',
    'Cybersecurity', 'Internet of Things (IoT)', 'Computational Science', 'Simulation', 'Modeling', 'Bioinformatics', 'Computational Biology',
    'Computational Chemistry', 'High-Performance Computing', 'Climate Science', 'Materials Science', 'Theoretical Physics', 'Astrophysics',
    'Quantum Information Science'
  ];
  
  const filteredKeywords = computed(() => {
    const input = keywordInput.value.toLowerCase();
    return availableKeywords.filter(keyword => keyword.toLowerCase().startsWith(input) && !keywords.value.includes(keyword));
  });
  
  const router = useRouter();
  
  async function generateInviteCode() {
    const result = await $fetch('/api/project/new', {
      method: "POST",
      body: {
        keywords: keywords.value,
        projectName: projectName.value,
        description: description.value
      }
    })
    console.log(result)
    nextLink.value = '/dashboard/project/'+result.projectId
    return result.inviteCode
  }
  
  function addKeyword() {
    const keyword = keywordInput.value.trim();
    if (keyword && !keywords.value.includes(keyword)) {
      keywords.value.push(keyword);
    }
    keywordInput.value = '';
    showDropdown.value = true; // Show dropdown after adding a keyword
  }
  
  function selectKeyword(keyword) {
    if (!keywords.value.includes(keyword)) {
      keywords.value.push(keyword);
    }
    keywordInput.value = '';
    showDropdown.value = true; // Show dropdown after selecting a keyword
  }
  
  function removeKeyword(index) {
    keywords.value.splice(index, 1);
  }
  
  function hideDropdown() {
    setTimeout(() => {
      showDropdown.value = false;
    }, 200);
  }
  
  function validateForm() {
    projectNameError.value = !projectName.value.trim();
    descriptionError.value = !description.value.trim();
    keywordsError.value = keywords.value.length === 0;
    return !projectNameError.value && !descriptionError.value && !keywordsError.value;
  }
  
  async function createInviteCode() {
    if (validateForm()) {
      inviteCode.value = await generateInviteCode();
      inviteCodeGenerated.value = true;
    }
  }
  
  async function submitProject() {
    if (validateForm()) {
      // Here you would typically send the project data to the server
      console.log('Project Submitted:', { projectName: projectName.value, description: description.value, keywords: keywords.value });
      await router.push('/dashboard');
    }
  }
  
  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode.value).then(() => {
      alert('Invite code copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy invite code: ', err);
    });
  }
  

  async function joinProject() {
    const data = await $fetch('/api/project/join', {
      method: "POST",
      body: {
        inviteCode: inviteCodeInput.value
      }
    })
    await router.push('/dashboard/project/' + data.projectId)
    // Here you would typically send the invite code to the server to join the project
    console.log('Joining Project with Invite Code:', inviteCodeInput.value);
  }
  </script>
  
  <style scoped>
  /* Add any custom styles here */
  .border-red-500 {
    border-color: #f56565;
  }
  .bg-gray-200 {
    background-color: #e2e8f0;
  }
  </style>