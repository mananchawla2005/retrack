import { defineStore } from 'pinia';

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    milestones: [],
    isLoading: false,
    error: null,
  }),
  
  actions: {
    async fetchTasks() {
      this.isLoading = true;
      this.error = null;
      
      try {
        // In a real application, you would fetch from an API
        // For now, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        this.tasks = [
          {
            id: '1',
            title: 'Research AI models',
            dueDate: '2023-06-15',
            projectName: 'AI Research Project',
            type: 'task',
            status: 'todo',
            priority: 'high'
          },
          {
            id: '2',
            title: 'Prepare literature review',
            dueDate: new Date().toISOString().split('T')[0], // today
            projectName: 'Machine Learning Study',
            type: 'task',
            status: 'inprogress',
            priority: 'medium'
          },
          {
            id: '3',
            title: 'Implement prototype',
            dueDate: (() => {
              const date = new Date();
              date.setDate(date.getDate() + 4);
              return date.toISOString().split('T')[0];
            })(),
            projectName: 'AI Research Project',
            type: 'task',
            status: 'todo',
            priority: 'high'
          },
          {
            id: '4',
            title: 'Write final report',
            dueDate: (() => {
              const date = new Date();
              date.setDate(date.getDate() + 20);
              return date.toISOString().split('T')[0];
            })(),
            projectName: 'Machine Learning Study',
            type: 'task',
            status: 'done',
            priority: 'low'
          },
        ];
        
        this.milestones = [
          {
            id: 'm1',
            title: 'Research Phase Complete',
            dueDate: (() => {
              const date = new Date();
              date.setDate(date.getDate() - 2);
              return date.toISOString().split('T')[0];
            })(),
            projectName: 'AI Research Project',
            type: 'milestone',
            status: 'done',
            priority: 'medium'
          },
          {
            id: 'm2',
            title: 'Implementation Phase',
            dueDate: new Date().toISOString().split('T')[0], // today
            projectName: 'AI Research Project',
            type: 'milestone',
            status: 'inprogress',
            priority: 'high'
          },
          {
            id: 'm3',
            title: 'Testing Complete',
            dueDate: (() => {
              const date = new Date();
              date.setDate(date.getDate() + 5);
              return date.toISOString().split('T')[0];
            })(),
            projectName: 'Machine Learning Study',
            type: 'milestone',
            status: 'todo',
            priority: 'high'
          },
          {
            id: 'm4',
            title: 'Project Completion',
            dueDate: (() => {
              const date = new Date();
              date.setDate(date.getDate() + 25);
              return date.toISOString().split('T')[0];
            })(),
            projectName: 'Machine Learning Study',
            type: 'milestone',
            status: 'todo',
            priority: 'medium'
          },
        ];
      } catch (err) {
        this.error = err.message || 'Failed to fetch tasks';
        console.error('Error fetching tasks:', err);
      } finally {
        this.isLoading = false;
      }
    },
    
    async updateTaskDueDate(taskId, newDueDate) {
      // In a real app, you would call an API here
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.dueDate = newDueDate;
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        return true;
      }
      
      // If not found in tasks, check milestones
      const milestone = this.milestones.find(m => m.id === taskId);
      if (milestone) {
        milestone.dueDate = newDueDate;
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        return true;
      }
      
      return false;
    },

    async updateTask(task) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // In a real app, you would call an API here
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
        
        if (task.type === 'task') {
          // Find and update the task in the tasks array
          const index = this.tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...task };
            return true;
          }
        } else if (task.type === 'milestone') {
          // Find and update the milestone in the milestones array
          const index = this.milestones.findIndex(m => m.id === task.id);
          if (index !== -1) {
            this.milestones[index] = { ...this.milestones[index], ...task };
            return true;
          }
        }
        
        return false;
      } catch (err) {
        this.error = err.message || 'Failed to update task';
        console.error('Error updating task:', err);
        return false;
      } finally {
        this.isLoading = false;
      }
    },
    
    async updateMilestone(milestone) {
      // Simply reuse the updateTask method since it can handle both types
      return this.updateTask(milestone);
    }
  }
});
