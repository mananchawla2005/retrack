<template>
  <div class="bigo">
    <div class="container">
      <div class="progress-bar">
        <div class="progress" :style="{ width: '25%' }"></div>
      </div>
      <h1>Let's Build Your Project</h1>
      <div class="preview">
        <h2>{{ projectName }}</h2>
        <div class="project-details">
          <p>{{ projectDescription }}</p>
        </div>
        <div class="milestones">
          <h3>Add Milestones</h3>
          <div class="milestone-card" v-for="(milestone, index) in milestones" :key="index">
            <div class="milestone">
              <i class="icon-tube-light"></i>
              <input v-model="milestone.text" :placeholder="'Milestone ' + (index + 1)" @blur="markAsCompleted(index + 1)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useState } from '#app'

const projectName = useState('projectName', () => 'Default Project Name')
const projectDescription = useState('projectDescription', () => 'Default Project Description')

const milestones = ref([
  { text: '', completed: false },
  { text: '', completed: false },
  { text: '', completed: false }
])

const markAsCompleted = (index) => {
  milestones.value[index - 1].completed = true
}
</script>

<style scoped>
body {
  background-image: url('/path/to/your/image.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  margin: 0;
  padding: 0;
  height: 100vh;
}

.container {
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Arial', sans-serif;
  max-width: 800px;
  margin: 0 auto;
}

.progress-bar {
  width: 100%;
  background-color: #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress {
  height: 10px;
  background-color: #353c1d;
  transition: width 0.3s;
}

h1 {
  text-align: center;
  font-size: 32px;
  color: #333;
  margin-bottom: 20px;
}

.preview {
  background-color: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview h2 {
  margin-bottom: 20px;
  font-size: 28px;
  color: #333;
  border-bottom: 2px solid #ddd;
  padding-bottom: 10px;
}

.milestones {
  margin-top: 20px;
}

.milestone-card {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.milestone {
  display: flex;
  align-items: center;
}

.icon-tube-light {
  width: 50px;
  height: 50px;
  background-size: contain;
  margin-right: 10px;
}

input {
  width: 100%;
  height: 40px;
  padding: 10px;
  font-size: 14px;
  margin-bottom: 10px;
  border: none;
  border-bottom: 2px solid #ddd;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #007bff;
  outline: none;
}
</style>