<template>
    <div class="toolbar">
        <button @click="setMode('highlight')" :class="{ active: currentMode === 'highlight' }">Highlighter</button>
        <button @click="setMode('pen')" :class="{ active: currentMode === 'pen' }">Pen</button>
        <input type="color" v-model="currentColor" v-show="currentMode !== 'select'">
        <input type="range" v-model="currentStrokeSize" min="1" max="10" v-show="currentMode === 'pen'">
    </div>
    <div v-if="error" class="error">
        {{ error }}
    </div>
    <div v-else-if="loading" class="loading">
        <div class="spinner"></div>
        Loading PDF...
    </div>

    <div v-else class="pdf-container">
        <div v-if="pdfInstance" class="pdf-pages">
            <div v-for="page in pages" :key="page" class="pdf-page" ref="pageContainers">
                <VuePDF :pdf="pdfInstance" :page="page" :text-layer="true" :scale="2"
                    @mouseup="currentMode === 'highlight' && handleTextSelection($event, page)" />
                <svg class="drawing-overlay" :class="{ 'active': currentMode === 'pen' }" :width="pageSize.width"
                    :height="pageSize.height" :viewBox="`0 0 ${pageSize.width} ${pageSize.height}`"
                    preserveAspectRatio="none" @mousedown="startDrawing($event, page)"
                    @mousemove="continueDrawing($event, page)" @mouseup="finishDrawing(page)"
                    @mouseleave="finishDrawing(page)">
                    <!-- Existing drawings -->
                    <path v-for="drawing in getDrawingsForPage(page)" :key="drawing.id" :d="getPathD(drawing.path)"
                        :stroke="drawing.color" :stroke-width="drawing.strokeWidth" fill="none"
                        stroke-linecap="round" />
                    <!-- Current drawing preview -->
                    <path v-if="isDrawing" :d="getPathD(currentPath)" :stroke="currentColor"
                        :stroke-width="currentStrokeSize" fill="none" stroke-linecap="round" />
                </svg>
            </div>
        </div>
        <div v-else class="error">No PDF content available</div>
    </div>

    <div class="debug-panel">
        <p>Status: {{ loading ? 'Loading' : (error ? 'Error' : 'Ready') }}</p>
        <p>Blob size: {{ blobSize }} bytes</p>
        <p>Pages: {{ pages || 0 }}</p>
        <p>Highlights: {{ highlights.length }}</p>
        <button @click="clearHighlights">Clear Highlights</button>
        <p>Annotations: {{ highlights.length + drawings.length }}</p>
        <button @click="clearAllAnnotations">Clear All</button>
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
const currentMode = ref('highlight')
const currentColor = ref('#ffff00')
const currentStrokeSize = ref(3)
const drawings = ref([])
const isDrawing = ref(false)
const currentPath = ref([])
let pdfUrl = null
let stopPdfWatch = null
const pdfDimensions = ref({ width: 0, height: 0 })
const pageSize = ref({ width: 0, height: 0 })

const startDrawing = (event, page) => {
    if (currentMode.value !== 'pen') return
    isDrawing.value = true
    const svg = event.target.closest('.drawing-overlay')
    const rect = svg.getBoundingClientRect()
    const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
    currentPath.value = [point]
}

const continueDrawing = (event, page) => {
    if (!isDrawing.value || currentMode.value !== 'pen') return
    const svg = event.target.closest('.drawing-overlay')
    const rect = svg.getBoundingClientRect()
    const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
    currentPath.value.push(point)
}

// Update SVG dimensions when PDF loads
const updatePdfDimensions = () => {
    nextTick(() => {
        const pdfElement = document.querySelector('.pdf-page')
        if (pdfElement) {
            const { width, height } = pdfElement.getBoundingClientRect()
            pageSize.value = { width, height }
            pdfDimensions.value = { width, height }
        }
    })
}

watch(() => pages.value, updatePdfDimensions)
onMounted(() => {
    window.addEventListener('resize', updatePdfDimensions)
    updatePdfDimensions
})
onUnmounted(() => window.removeEventListener('resize', updatePdfDimensions))

const setMode = (mode) => {
    if (['highlight', 'pen'].includes(mode)) {
        currentMode.value = mode
    }
}

// const startDrawing = (event, page) => {
//     if (currentMode.value !== 'pen') return
//     isDrawing.value = true
//     const svg = event.target.closest('.drawing-overlay')
//     const rect = svg.getBoundingClientRect()
//     currentPath.value = [{
//         x: event.clientX - rect.left,
//         y: event.clientY - rect.top
//     }]
// }
const getDrawingsForPage = (page) => {
    return drawings.value.filter(d => d.page === page)
}

const getPathD = (path) => {
    return path.length > 0
        ? `M ${path.map(p => `${p.x} ${p.y}`).join(' L ')}`
        : ''
}

const clearAllAnnotations = () => {
    highlights.value = []
    drawings.value = []
}
// const continueDrawing = (event, page) => {
//     if (!isDrawing.value || currentMode.value !== 'pen') return
//     const svg = event.target.closest('.drawing-overlay')
//     const rect = svg.getBoundingClientRect()
//     currentPath.value.push({
//         x: event.clientX - rect.left,
//         y: event.clientY - rect.top
//     })
// }

const finishDrawing = (page) => {
    if (!isDrawing.value) return
    isDrawing.value = false
    if (currentPath.value.length < 2) return

    drawings.value.push({
        id: generateId(),
        page,
        color: currentColor.value,
        strokeWidth: currentStrokeSize.value,
        path: [...currentPath.value]
    })
    currentPath.value = []
}
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
const highlights = ref([])
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

function handleTextSelection(event, page) {
    const selection = window.getSelection();
    if (!selection.toString()) return;

    const range = selection.getRangeAt(0);
    const highlightColor = 'yellow';

    const highlight = {
        id: generateId(),
        text: selection.toString(),
        page: page,
        color: highlightColor
    };

    highlights.value.push(highlight);

    const highlightSpan = document.createElement('span');
    highlightSpan.style.backgroundColor = highlightColor;
    highlightSpan.classList.add('highlight');
    highlightSpan.dataset.highlightId = highlight.id;

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '✖ Delete';
    deleteButton.classList.add('delete-button');
    deleteButton.dataset.highlightId = highlight.id;

    highlightSpan.appendChild(deleteButton);
    range.surroundContents(highlightSpan);

    selection.removeAllRanges();
}

function deleteHighlight(highlightId) {
    // Remove from highlights array
    highlights.value = highlights.value.filter(h => h.id !== highlightId);

    // Remove highlight span
    const highlightSpan = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (highlightSpan) {
        const parent = highlightSpan.parentNode;
        while (highlightSpan.firstChild) {
            if (!highlightSpan.firstChild.classList?.contains('delete-icon')) {
                parent.insertBefore(highlightSpan.firstChild, highlightSpan);
            } else {
                highlightSpan.removeChild(highlightSpan.firstChild);
            }
        }
        parent.removeChild(highlightSpan);
    }
}

onMounted(() => {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-icon')) {
            const highlightId = e.target.dataset.highlightId;
            deleteHighlight(highlightId);
        }
    });
});

onUnmounted(() => {
    document.removeEventListener('click', deleteHighlight);
});

import { nextTick } from 'vue'

const pageContainers = ref([])

// Update SVG dimensions on resize
const updateSVGDimensions = () => {
    nextTick(() => {
        pageContainers.value.forEach(container => {
            const svg = container.querySelector('.drawing-overlay')
            if (!svg) return

            const { width, height } = container.getBoundingClientRect()
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
            svg.setAttribute('width', width)
            svg.setAttribute('height', height)
        })
    })
}

// Watch for page changes and window resize
watch(() => pages.value, updateSVGDimensions)
onMounted(() => {

    window.addEventListener('resize', updateSVGDimensions)
})
onUnmounted(() => window.removeEventListener('resize', updateSVGDimensions))

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

.toolbar {
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    gap: 8px;
    align-items: center;
}

.toolbar button.active {
    background: #e0e0e0;
}

/* Disable text selection in pen mode */
.pen-mode .textLayer {
    user-select: none;
    -webkit-user-select: none;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.debug-panel {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
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

.pdf-page :deep(.textLayer) {
    opacity: 1 !important;
    z-index: 2;
    pointer-events: auto;
    user-select: text;
}

.pdf-page :deep(.textLayer span) {
    cursor: text;
    pointer-events: auto;
    user-select: text;
}

/* .pdf-page :deep(.highlight) {
    background-color: yellow;
    opacity: 0.5;
    cursor: pointer;
} */

.pdf-page :deep(.highlight:hover) {
    opacity: 0.7;

}

/* .pdf-page :deep(.highlight) {
    background-color: yellow;
    opacity: 0.5;
    cursor: pointer;
    position: relative;
    display: inline-block;
} */

/* .pdf-page :deep(.delete-icon) {
    position: absolute;
    top: -10px;
    right: -10px;
    background-color: #ff4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    z-index: 1000;
    font-weight: bold;
    line-height: 20px;
    text-align: center;
} */
/* .pdf-page :deep(.highlight:hover .delete-icon) {
    display: block;
} */
/* .pdf-page :deep(.highlight) {
    background-color: yellow;
    opacity: 0.5;
    cursor: pointer;
    position: relative;
    display: inline-block;
} */

.pdf-page :deep(.delete-container) {
    position: absolute;
    top: -30px;
    right: -10px;
    background-color: #ff4444;
    color: white;
    border-radius: 4px;
    padding: 2px 8px;
    display: none;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    z-index: 1000;
    font-size: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.pdf-page :deep(.delete-icon) {
    font-weight: bold;
    font-size: 14px;
}

.pdf-page :deep(.delete-text) {
    white-space: nowrap;
}

.pdf-page :deep(.highlight:hover .delete-container) {
    display: flex;
}

/* Remove old delete-icon styles */
.pdf-page :deep(.delete-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.pdf-page :deep(.highlight) {
    background-color: yellow;
    opacity: 0.5;
    position: relative;
    display: inline-block;
    cursor: pointer;
    transition: opacity 0.2s;
}

.pdf-page :deep(.highlight:hover) {
    opacity: 0.7;
}

.pdf-page :deep(.delete-button) {
    position: absolute;
    top: -25px;
    right: 0;
    background-color: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    display: none;
    z-index: 1000;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.pdf-page {
  position: relative;
  display: inline-block;
  width: 100%;
  margin-bottom: 20px; /* Add spacing between pages */
}

.drawing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.drawing-overlay.active {
  pointer-events: all;
  cursor: crosshair;
}

.drawing-overlay path {
    vector-effect: non-scaling-stroke;
}

:deep(.textLayer) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
}

:deep(.pdfViewer) {
    z-index: 1;
}
</style>