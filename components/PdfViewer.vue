<template>
    <div v-if="error" class="error">
        {{ error }}
    </div>
    <div v-else-if="loading" class="loading">
        <div class="spinner"></div>
        Loading PDF...
    </div>
    <div v-else class="pdf-container">
        <div v-if="pdfInstance" class="pdf-pages">
            <div v-for="page in pages" :key="page" class="pdf-page">
                <VuePDF 
                    :pdf="pdfInstance" 
                    :page="page" 
                    text-layer
                    :scale="2"
                />
            </div>
        </div>
        <div v-else class="error">No PDF content available</div>
    </div>

    <div class="debug-panel">
        <p>Status: {{ loading ? 'Loading' : (error ? 'Error' : 'Ready') }}</p>
        <p>Blob size: {{ blobSize }} bytes</p>
        <p>Pages: {{ pages || 0 }}</p>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { VuePDF, usePDF } from '@tato30/vue-pdf'
import '@tato30/vue-pdf/style.css'

const route = useRoute()
const pages = ref([])
const loading = ref(true)
const error = ref(null)
const blobSize = ref(0)
const pdfInstance = ref(null)
const pageCount = ref(0)
let pdfUrl = null
let stopPdfWatch = null

function onError(reason) {
    error.value = `PDF loading error: ${reason}`
    console.error(error.value)
}

function initPdf(url) {
    try {
        const { pdf, pages: pdfPages } = usePDF(url, { 
            onError,
            withCredentials: true
        })
        
        stopPdfWatch = watch([pdf, pdfPages], ([pdfVal, pagesVal], _, onCleanup) => {
            if (pdfVal) {
                pdfInstance.value = pdfVal
                pages.value = pagesVal || []
                pageCount.value = pagesVal?.length || 0
                loading.value = false
            } else if (!loading.value) {
                error.value = 'Failed to load PDF content'
            }
        }, { immediate: true })
    } catch (err) {
        error.value = `PDF initialization error: ${err.message}`
        loading.value = false
    }
}
onMounted(async () => {
    try {
        loading.value = true
        error.value = null
        
        const response = await fetch(`/api/literature/pdf/${route.params.id}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const arrayBuffer = await response.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
        blobSize.value = blob.size
        
        if (pdfUrl) URL.revokeObjectURL(pdfUrl)
        pdfUrl = URL.createObjectURL(blob)
        
        initPdf(pdfUrl)
    } catch (err) {
        error.value = `Error loading PDF: ${err.message}`
        loading.value = false
        console.error('PDF loading error:', err)
    }
})

onUnmounted(() => {
    if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        pdfUrl = null
    }
    if (stopPdfWatch) {
        stopPdfWatch()
    }
})
</script>

<style scoped>
.error {
    color: red;
    padding: 1rem;
}

.loading {
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.debug-panel {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
}

.pdf-container {
    height: 100vh;
    overflow-y: auto;
    padding: 1rem;
}

.pdf-pages {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
}

.pdf-page {
    max-width: 100%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>