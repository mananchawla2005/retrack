<template>
  <div class="literature-page">
    <h1>Upload Research Paper</h1>
    <div class="button-group">
      <button :class="{ selected: selectedOption === 'zotero' }" @click="selectOption('zotero')">
        <i class="icon zotero-icon"></i> Zotero
      </button>
      <button :class="{ selected: selectedOption === 'arxiv' }" @click="selectOption('arxiv')">
        <i class="icon arxiv-icon"></i> arXiv
      </button>
      <button :class="{ selected: selectedOption === 'computer' }" @click="selectOption('computer')">
        <i class="icon upload-icon"></i> Upload from Computer
      </button>
    </div>

    <div v-if="selectedOption === 'zotero'" class="upload-card">
      <form @submit.prevent="uploadFromZotero">
        <div class="form-group">
          <label for="zoteroLink">Zotero Link</label>
          <input type="text" id="zoteroLink" v-model="zoteroLink" required />
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>

    <div v-if="selectedOption === 'arxiv'" class="upload-card">
      <form @submit.prevent="uploadFromArxiv">
        <div class="form-group">
          <label for="arxivId">arXiv ID or URL</label>
          <input type="text" id="arxivId" v-model="arxivId" required 
                 placeholder="e.g., 2101.12345 or https://arxiv.org/abs/2101.12345"/>
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>

    <div v-if="selectedOption === 'computer'" class="upload-card">
      <form @submit.prevent="uploadFromComputer">
        <div class="form-group">
          <label for="paperTitle">Title</label>
          <input type="text" id="paperTitle" v-model="paperTitle" required />
        </div>
        <div class="form-group">
  <label for="paperAuthors">Authors</label>
  <input type="text" id="paperAuthors" v-model="paperAuthors" 
         placeholder="Enter authors (separated by commas)"/>
</div>
        <div class="form-group">
          <label for="paperFile">Upload File</label>
          <input type="file" id="paperFile" ref="paperFileInput" @change="handleFileUpload" 
                 accept=".pdf" required />
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>

    <div class="tabs-container">
      <div class="tabs">
        <button 
          :class="{ 'tab-button': true, 'active': selectedSection === 'all' }" 
          @click="selectSection('all')"
        >
          All Papers
        </button>
        <button 
          :class="{ 'tab-button': true, 'active': selectedSection === 'read' }" 
          @click="selectSection('read')"
        >
          Read Papers
        </button>
        <button 
          :class="{ 'tab-button': true, 'active': selectedSection === 'unread' }" 
          @click="selectSection('unread')"
        >
          Unread Papers
        </button>
      </div>

      <div class="section-content">
        <div class="cards-container">
          <div v-for="(item, index) in filteredItems" :key="index" class="card">
            <div class="card-content">
              <h3>Title:{{ item.title }}</h3>
              <p class="authors" v-if="item.authors">Authors: {{ item.authors }}</p>
              <p class="upload-date">Added: {{ formatDate(item.uploadDate) }}</p>
              <p class="source">Source: {{ item.source }}</p>
            </div>
            <div class="card-actions">
              <button @click="toggleReadStatus(index)" class="read-button" 
                      :title="item.read ? 'Mark as Unread' : 'Mark as Read'">
                <i :class="item.read ? 'icon unread-icon' : 'icon read-icon'"></i>
              </button>
              <button @click="viewPaper(item)" class="view-button" title="View Paper">
                <i class="icon view-icon"></i>
              </button>
              <button @click="deleteItem(index)" class="delete-button" title="Delete">
                <i class="icon delete-icon"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// State
const selectedOption = ref(null)
const selectedSection = ref('all')
const zoteroLink = ref('')
const arxivId = ref('')
const paperTitle = ref('')
const paperAuthors = ref('')
const paperFile = ref(null)
const uploadedItems = ref([])

const paperFileInput = ref(null)

// Methods
const selectOption = (option) => {
  selectedOption.value = option
}

const selectSection = (section) => {
  selectedSection.value = section
}

const handleFileUpload = (event) => {
  paperFile.value = event.target.files[0]
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const uploadFromZotero = () => {
  if (!zoteroLink.value) return
  
  const newItem = {
    title: 'Zotero Paper Title', // This would come from Zotero API
    authors: 'Zotero Authors',
    source: 'Zotero',
    uploadDate: new Date().toISOString(),
    read: false
  }
  uploadedItems.value.push(newItem)
  zoteroLink.value = ''
}

const uploadFromArxiv = () => {
  if (!arxivId.value) return
  
  const newItem = {
    title: 'arXiv Paper Title', // This would come from arXiv API
    authors: 'arXiv Authors',
    source: 'arXiv',
    uploadDate: new Date().toISOString(),
    read: false
  }
  uploadedItems.value.push(newItem)
  arxivId.value = ''
}

const uploadFromComputer = () => {
  if (!paperTitle.value || !paperFile.value) {
    alert('Please fill in all fields')
    return
  }

  const newItem = {
    title: paperTitle.value,
    authors: paperAuthors.value || null,
    source: 'Local Upload',
    uploadDate: new Date().toISOString(),
    read: false,
    file: paperFile.value
  }
  uploadedItems.value.push(newItem)
  
  // Reset form
  paperTitle.value = ''
  paperAuthors.value = ''
  paperFile.value = null
  if (paperFileInput.value) {
    paperFileInput.value.value = ''
  }
}

const deleteItem = (index) => {
  if (confirm('Are you sure you want to delete this paper?')) {
    uploadedItems.value.splice(index, 1)
  }
}

const toggleReadStatus = (index) => {
  uploadedItems.value[index].read = !uploadedItems.value[index].read
}

const viewPaper = (item) => {
  // Implementation would depend on how you want to display the paper
  console.log('Viewing paper:', item.title)
}

const filteredItems = computed(() => {
  switch (selectedSection.value) {
    case 'read':
      return uploadedItems.value.filter(item => item.read)
    case 'unread':
      return uploadedItems.value.filter(item => !item.read)
    default: // 'all'
      return uploadedItems.value
  }
})
</script>

<style scoped>
.literature-page {
  padding: 40px;
  background: #f9f9f9;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
  color: #333;
}

.button-group {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}

button {
  background: none;
  color: #007bff;
  padding: 15px 20px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 1em;
  transition: all 0.3s ease;
}

button:hover {
  color: #0056b3;
  background: rgba(0, 123, 255, 0.1);
}

button.selected {
  color: #0056b3;
  background: rgba(0, 123, 255, 0.15);
  border-radius: 8px;
}

.upload-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  width: 100%;
  max-width: 600px;
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}

.form-group input[type="file"] {
  padding: 8px;
}

.tabs-container {
  width: 100%;
  margin-top: 40px;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.tab-button {
  padding: 12px 24px;
  font-size: 1.1em;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: #007bff;
  color: white;
}

.section-content {
  width: 100%;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px;
  justify-content: flex-start;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: calc(33.333% - 20px);
  min-width: 250px;
  max-width: 350px;
  margin-bottom: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  margin-bottom: 15px;
}

.card-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.read-button,
.delete-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.read-button:hover,
.delete-button:hover {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.icon {
  font-size: 1.2em;
}

.read-icon::before {
  content: '📖';
}

.unread-icon::before {
  content: '📕';
}

.delete-icon::before {
  content: '🗑️';
}

/* Icons for upload options */
.zotero-icon::before {
  content: '📚';
}

.google-scholar-icon::before {
  content: '🎓';
}

.upload-icon::before {
  content: '📤';
}

@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
    align-items: stretch;
  }

  .card {
    width: 100%;
    max-width: none;
  }

  .tabs {
    flex-direction: column;
    gap: 10px;
  }
}
</style>