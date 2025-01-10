<template>
    <div class="page-container">
      <!-- ... existing code ... -->
      <div class="progress-bar-wrapper">
        <div class="progress-bar-container">
          <div class="progress-bar"></div>
        </div>
      </div>
      <p class="intro-text">Let's create your first project</p>
      <div class="content-wrapper">
        <div class="card centered-section">
          <button class="arrow-button" @click="handleArrowClick">→</button>
          <p class="description-text">Let's break your research process into small milestones</p>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <input type="text" id="milestone-title" v-model="milestoneTitle" placeholder="Milestone Title" required />
            </div>
            <div class="form-group">
              <input type="date" id="milestone-deadline" v-model="milestoneDeadline" placeholder="Milestone Deadline" required />
            </div>
            <button type="submit" class="full-width-button">Add Milestone</button>
          </form>
          <div v-for="(milestone, index) in milestones" :key="index" class="milestone-card">
            <div class="milestone-header">
              <p class="milestone-title">{{ milestone.title }}</p>
              <button @click="removeMilestone(index)" class="remove-button">×</button>
            </div>
            <p class="milestone-deadline">{{ milestone.deadline }}</p>
          </div>
        </div>
      </div>
      <!-- ... existing code ... -->
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const milestoneTitle = ref('');
  const milestoneDeadline = ref('');
  const milestones = ref([]);
  
  const handleSubmit = () => {
    if (milestoneTitle.value && milestoneDeadline.value) {
      milestones.value.push({
        title: milestoneTitle.value,
        deadline: milestoneDeadline.value,
      });
      milestoneTitle.value = '';
      milestoneDeadline.value = '';
    }
  };
  
  const removeMilestone = (index) => {
    milestones.value.splice(index, 1);
  };
  
  const handleArrowClick = () => {
    // Add your click handler logic here
    console.log('Arrow button clicked');
  };
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
  
  .page-container {
    padding: 20px; /* Add padding to the container */
  }
  
  .progress-bar-wrapper {
    display: flex;
    justify-content: center;
    align-items: flex-start; /* Align items to the top */
    margin-top: 20px; /* Add margin from the top */
  }
  
  .progress-bar-container {
    width: 100%; /* Set width to 100% to match the container */
    max-width: 500px; /* Ensure it doesn't exceed the container's max width */
    background-color: #e0e0e0;
    border-radius: 20px; /* Curved edges */
    overflow: hidden;
    height: 10px; /* Make it thinner */
  }
  
  .progress-bar {
    width: 33.33%; /* Fill 1/3rd of the container */
    height: 100%;
    background-color: #76c7c0;
    transition: width 0.3s ease;
    border-radius: 20px; /* Curved edges */
  }
  
  .intro-text {
    text-align: center;
    margin-top: 20px; /* Add more margin from the progress bar */
    font-size: 1.5em; /* Adjust font size as needed */
    color: #333; /* Adjust text color as needed */
    font-family: 'Roboto', sans-serif; /* Use the imported font */
    font-weight: 700; /* Make the text bold */
  }
  
  .content-wrapper {
    display: flex;
    justify-content: center; /* Center the content */
    margin-top: 20px; /* Add margin from the intro text */
    overflow: hidden; /* Prevent children from overflowing */
  }
  
  .card {
    background-color: #fff; /* White background */
    border-radius: 10px; /* Rounded corners */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
    padding: 20px; /* Add padding inside the card */
    margin: 10px 0; /* Add vertical margin around the card */
    position: relative; /* Ensure the arrow button is positioned correctly */
  }
  
  .centered-section {
    width: auto; /* Keep the width as compact as it was */
    max-width: 500px; /* Set a maximum width to ensure it doesn't expand too much */
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Prevent content from overflowing */
  }
  
  .description-text {
    font-size: 1.2em; /* Increase font size */
    color: #555; /* Adjust text color as needed */
    font-family: 'Roboto', sans-serif; /* Use the imported font */
    margin-bottom: 20px; /* Add space below the description text */
  }
  
  .arrow-button {
    background: none;
    border: none;
    font-size: 2em;
    cursor: pointer;
    color: #76c7c0;
    position: absolute;
    right: 20px;
    top: 10px; /* Adjust this value as needed to position the button correctly */
  }
  
  .arrow-button:hover {
    color: #64b3af;
  }
  
  .form-group {
    margin-bottom: 15px; /* Add space between form groups */
  }
  
  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  button.full-width-button {
    width: 100%; /* Make the button full width */
    background-color: #76c7c0;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
  }
  
  button.full-width-button:hover {
    background-color: #64b3af;
  }
  
  .milestone-card {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    margin-top: 10px;
    position: relative;
    display: flex;
    flex-direction: column;
    max-width: 100%; /* Ensure the card does not exceed the container width */
  }
  
  .milestone-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden; /* Ensure the content does not overflow */
  }
  
  .milestone-title {
    font-size: 1.2em; /* Increase font size */
    margin: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  
  .milestone-deadline {
    color: #888;
    font-size: 0.9em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-top: 10px; /* Add margin to ensure it is on the next line */
  }
  
  .remove-button {
    background: none;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    color: #888;
  }
  
  .remove-button:hover {
    color: #555;
  }
  </style>