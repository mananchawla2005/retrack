<template>
    <div class="toolbar">
        <button @click="setMode('highlight')" :class="{ active: currentMode === 'highlight' }">Highlighter</button>
        <button @click="setMode('pen')" :class="{ active: currentMode === 'pen'}">Pen</button>
        <input type="color" v-model="currentColor" @change="setColor" v-show="currentMode !== 'select'">
        <input type="range" v-model="currentStrokeSize" @change="setStroke" min="1" max="10" v-show="(currentMode === 'pen' || currentMode == 'eraser')">
        <button @click="setEraserMode" :class="{ active: currentMode === 'eraser' }" v-show="(currentMode === 'pen' || currentMode == 'eraser')" >Eraser</button>
        <button @click="saveAnnotations" :disabled="saving" class="save-button" :class="{ 'is-saving': saving }">
            <span v-if="!saving">Save</span>
            <span v-else class="save-spinner"></span>
        </button>
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
                    <div :class="{ 'drawing-active': currentMode === 'pen' || currentMode === 'eraser' }" class="drawing-layer absolute top-0 left-0 right-0 w-full h-full z-20" ref="containerRef">
                        <vp-editor 
                        :key="editorDimensions.width + '-' + editorDimensions.height"
                        class="text-center" 
                        :width="editorDimensions.width" 
                        :height="editorDimensions.height"
                        v-model:history="histories[page]" 
                        :settings="settings" 
                        @save="downloadSvg" 
                        :tools
                        />
                    </div>
            </div>
        </div>
        <div v-else class="error">No PDF content available</div>
    </div>

    <div class="debug-panel">
        <p>Status: {{ loading ? 'Loading' : (error ? 'Error' : 'Ready') }}</p>
        <p>Blob size: {{ blobSize }} bytes</p>
        <p>Pages: {{ pages || 0 }}</p>
        <p>Highlights: {{ highlights.length }}</p>
        <!-- <button @click="clearHighlights">Clear Highlights</button>
        <p>Annotations: {{ highlights.length + drawings.length }}</p>
        <button @click="clearAllAnnotations">Clear All</button> -->
    </div>
    <div v-if="showContextMenu" class="context-menu" :style="contextMenuPosition">
        <div class="context-menu-item" @click="handleContextMenuDelete">Delete Highlight</div>
    </div>
</template>

<script setup>
import { VuePDF, usePDF } from '@tato30/vue-pdf'
import '@tato30/vue-pdf/style.css'
import { VpEditor, useFreehand, useRectangle, downloadSvg, createSettings, useEraser} from 'vue-paint'
const tools = [useFreehand(), useRectangle(), useEraser()]
const histories = ref({})
const settings = createSettings(tools, { color: "#000000" })

const route = useRoute()
const pages = ref([])
const loading = ref(true)
const error = ref(null)
const blobSize = ref(0)
const pdfInstance = ref(null)
const pageCount = ref(0)
const currentMode = ref('highlight')
const currentColor = ref('#000000')
const currentStrokeSize = ref(3)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ top: '0px', left: '0px' })
const selectedHighlightId = ref(null)
const containerRef = ref(null)
const editorDimensions = ref({ width: 0, height: 0 })
const saving = ref(false)
let pdfUrl = null
let stopPdfWatch = null
const updateDimensions = () => {
    if (!containerRef.value) return
    editorDimensions.value = {
        width: containerRef.value[0].offsetWidth,
        height: containerRef.value[0].offsetHeight
    }
    console.log(editorDimensions.value)
}

const setMode = (mode) => {
  // If same mode is clicked again, switch to 'select'
  if (currentMode.value === mode) {
    currentMode.value = 'select'
    settings.value.tool = 'none'
    return
  }
  if (['highlight', 'pen'].includes(mode)) {
    currentMode.value = mode
    if (mode === 'pen') {
      settings.value.tool = 'freehand'
      updateDimensions()
    } else {
      settings.value.tool = 'none'
    }
  }
}

const getPageHistory = (pageNum) => {
  if (!histories.value.has(pageNum)) {
    histories.value.set(pageNum, [])
  }
  return histories.value[pageNum]
}

const setStroke = () => {
    settings.value.thickness = currentStrokeSize
}
const setColor = () => {
    settings.value.color = currentColor
}

const setEraserMode = () => {
  // If eraser is clicked again, switch to 'select'
  if (currentMode.value === 'eraser') {
    currentMode.value = 'select'
    settings.value.tool = 'none'
  } else {
    settings.value.tool = 'eraser'
    currentMode.value = 'eraser'
  }
}

const initializeMode = () => {
  // Force initial mode setup
  const textLayers = document.querySelectorAll('.textLayer')
  textLayers.forEach(layer => {
      layer.classList.remove('drawing-mode')
  })
  
  // Reset editor settings
  settings.value.tool = 'none' // Disable drawing initially
}

onMounted(() => {
initializeMode()
  if (!containerRef.value) return

  // Initial measurement
  nextTick(() => {

      updateDimensions()
    
      // Create ResizeObserver
      const observer = new ResizeObserver(() => {
        updateDimensions()
      })
    
      // Start observing
      observer.observe(containerRef.value)
    
      // Cleanup
      onUnmounted(() => {
        observer.disconnect()
      })
  })
})

function showMenu(e, highlightId) {
  e.preventDefault()
  selectedHighlightId.value = highlightId
  contextMenuPosition.value = {
    top: `${e.clientY}px`,
    left: `${e.clientX}px`
  }
  showContextMenu.value = true
}


function handleContextMenuDelete() {
  if (selectedHighlightId.value) {
    deleteHighlight(selectedHighlightId.value)
    showContextMenu.value = false
  }
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

        stopPdfWatch = watch([pdf, pdfPages], async ([pdfVal, pagesVal], _, onCleanup) => {
            if (pdfVal) {
                pdfInstance.value = pdfVal
                pages.value = pagesVal || []
                pageCount.value = pagesVal?.length || 0
                await nextTick()
                loading.value = false
                updateDimensions()
                for (let index = 1; index <= pageCount.value; index++) {
                  histories.value[index] = []
                  
                }
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
        await loadAnnotations();
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

// Add helper to convert hex to rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function handleTextSelection(event, page) {
    const selection = window.getSelection();
    if (!selection.toString()) return;
    
    const range = selection.getRangeAt(0);
    const highlightId = generateId();
    
    // Get the client rects of the selection
    const rects = range.getClientRects();
    const containerRect = event.target.closest('.pdf-page').getBoundingClientRect();
    
    // Convert client coordinates to relative coordinates
    const coordinates = Array.from(rects).map(rect => ({
        x: (rect.x - containerRect.x) / containerRect.width,
        y: (rect.y - containerRect.y) / containerRect.height,
        width: rect.width / containerRect.width,
        height: rect.height / containerRect.height
    }));

    const highlight = {
        id: highlightId,
        page: page,
        color: currentColor.value,
        coordinates
    };
    
    highlights.value.push(highlight);

    // Create floating highlights using RGBA colors
    coordinates.forEach(coord => {
        const floatingHighlight = document.createElement('span');
        floatingHighlight.classList.add('floating-highlight');
        floatingHighlight.dataset.highlightId = highlightId;
        floatingHighlight.style.backgroundColor = hexToRgba(currentColor.value, 0.3);
        floatingHighlight.style.position = 'absolute';
        floatingHighlight.style.left = `${coord.x * 100}%`;
        floatingHighlight.style.top = `${coord.y * 100}%`;
        floatingHighlight.style.width = `${coord.width * 100}%`;
        floatingHighlight.style.height = `${coord.height * 100}%`;
        floatingHighlight.addEventListener('contextmenu', (e) => showMenu(e, highlightId));
        
        event.target.closest('.pdf-page').querySelector('.textLayer').appendChild(floatingHighlight);
    });

    selection.removeAllRanges();
}

const recreateHighlight = (highlight) => {
    const pageElement = document.querySelector(`.pdf-page:nth-child(${highlight.page})`);
    if (!pageElement) return;
    
    const textLayer = pageElement.querySelector('.textLayer');

    // Create floating highlights
    highlight.coordinates.forEach(coord => {
        const span = document.createElement('span');
        span.classList.add('floating-highlight');
        span.dataset.highlightId = highlight.id;
        span.style.backgroundColor = hexToRgba(highlight.color, 0.3);
        span.style.position = 'absolute';
        span.style.left = `${coord.x * 100}%`;
        span.style.top = `${coord.y * 100}%`;
        span.style.width = `${coord.width * 100}%`;
        span.style.height = `${coord.height * 100}%`;
        span.style.pointerEvents = 'all'; // Make sure it's clickable
        
        span.addEventListener('contextmenu', (e) => showMenu(e, highlight.id));
        
        textLayer.appendChild(span);
    });
};

const loadAnnotations = async () => {
    try {
        const response = await fetch('/api/literature/load', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                urlId: route.params.id
            })
        });
        const data = await response.json();
        
        // Load highlights
        highlights.value = data.highlights;
        highlights.value.forEach(recreateHighlight);
        
        // Load drawings
        if (data.pageDrawings) {
          histories.value = data.pageDrawings
          nextTick(() => {
                // Force canvas update
                updateDimensions();
            });
        }
    } catch (error) {
        console.error('Failed to load annotations:', error);
    }
};

function deleteHighlight(highlightId) {
    // Remove from highlights array
    highlights.value = highlights.value.filter(h => h.id !== highlightId);
    
    // Remove all highlight spans
    const highlightSpans = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    highlightSpans.forEach(span => span.remove());
}

onMounted(() => {
  document.addEventListener('click', () => {
    showContextMenu.value = false
  })
})

onUnmounted(() => {
  document.removeEventListener('click', () => {
    showContextMenu.value = false
  })
})

watch(currentMode, (newMode) => {
    const textLayers = document.querySelectorAll('.textLayer')
    textLayers.forEach(layer => {
        layer.classList.toggle('drawing-mode', newMode === 'pen' || newMode === 'eraser')
    })
})

const saveAnnotations = async () => {
    if (saving.value) return;
    try {
        saving.value = true;
        const pageDrawings = {...histories.value} // Create a copy of histories object
        
        // Filter out empty history arrays
        Object.keys(pageDrawings).forEach(page => {
            if (pageDrawings[page].length === 0) {
                delete pageDrawings[page]
            }
        })

        await fetch('/api/literature/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                urlId: route.params.id,
                highlights: highlights.value,
                pageDrawings
            })
        });
    } catch (error) {
        console.error('Failed to save annotations:', error);
    } finally {
        saving.value = false;
    }
};
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
    z-index: 50;
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


.pdf-page :deep(.highlight:hover .highlight-delete-btn) {
    display: flex;
    align-items: center;
    justify-content: center;
}



.pdf-page :deep(.highlight),
.pdf-page :deep(.floating-highlight) {
    background-color: var(--highlight-color, yellow);
    pointer-events: all;
    cursor: pointer;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 0;
  min-width: 150px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 1000;
}

.context-menu-item {
  padding: 8px 12px;
  cursor: pointer;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}

.pdf-page {
    position: relative;
}

.drawing-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    pointer-events: none;
    transition: pointer-events 0.2s;
}

.drawing-layer.drawing-active {
    pointer-events: auto;
}

:deep(.pdfViewer) {
    z-index: 10;
}
:deep(.vp-toolbar) {
    display: none !important;
    
     /* z-index: 50; */
}
.pdf-page :deep(.textLayer) {
    opacity: 1 !important;
    z-index: 20;
    pointer-events: auto;
    user-select: text;
}

.pdf-page :deep(.textLayer.drawing-mode) {
    pointer-events: none;
    user-select: none;
}

.floating-highlight {    position: absolute;
    pointer-events: all !important;
    z-index: 3;
    background-color: var(--highlight-color, yellow);
    cursor: pointer;
    mix-blend-mode: lighten;
}

.save-button {
    position: relative;
    min-width: 60px;
    height: 32px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
}

.save-button:disabled {
    background: #fff;
    cursor: not-allowed;
}

.save-button.is-saving {
    color: transparent;  /* Hide text but keep button size */
}

.save-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #ccc;
    border-radius: 50%;
    border-top-color: #666;
    animation: spin 1s ease-in-out infinite;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

@keyframes spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>