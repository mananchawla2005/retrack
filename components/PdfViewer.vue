<template>
    <div class="toolbar">
        <button @click="setMode('highlight')" :class="{ active: currentMode === 'highlight' }">Highlighter</button>
        <button @click="setMode('pen')" :class="{ active: currentMode === 'pen'}">Pen</button>
        <input type="color" v-model="currentColor" @change="setColor" v-show="currentMode !== 'select'">
        <input type="range" v-model="currentStrokeSize" @change="setStroke" min="1" max="10" v-show="(currentMode === 'pen' || currentMode == 'eraser')">
        <button @click="setEraserMode" :class="{ active: currentMode === 'eraser' }" v-show="(currentMode === 'pen' || currentMode == 'eraser')" >Eraser</button>
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
                        :history="getPageHistory(page)" 
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
const histories = ref(new Map())
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
    if (['highlight', 'pen'].includes(mode)) {
        currentMode.value = mode
        if(mode === 'pen') {
            settings.value.tool = 'freehand'
            updateDimensions()
        } else {
            settings.value.tool = 'none' // Disable drawing in highlight mode
        }
    }
}

const getPageHistory = (pageNum) => {
  if (!histories.value.has(pageNum)) {
    histories.value.set(pageNum, [])
  }
  return histories.value.get(pageNum)
}

const setStroke = () => {
    settings.value.thickness = currentStrokeSize
}
const setColor = () => {
    settings.value.color = currentColor
}

const setEraserMode = () => {
    console.log(settings.value)
    settings.value.tool='eraser'
    currentMode.value = 'eraser'
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

const attachCombinedHover = (el, id) => {
  el.addEventListener('mouseenter', () => {
    document.querySelectorAll(`[data-highlight-id="${id}"]`).forEach(elem => {
      elem.classList.add('combined-hover')
    })
  })
  el.addEventListener('mouseleave', () => {
    document.querySelectorAll(`[data-highlight-id="${id}"]`).forEach(elem => {
      elem.classList.remove('combined-hover')
    })
  })
}
const createHighlightSpan = (highlightId, color) => {
  const container = document.createElement('span')
  container.style.backgroundColor = color
  container.classList.add('highlight')
  container.dataset.highlightId = highlightId
  container.addEventListener('contextmenu', (e) => showMenu(e, highlightId))
  attachCombinedHover(container, highlightId)
  return container
}

function handleTextSelection(event, page) {
  const selection = window.getSelection();
  if (!selection.toString()) return;
  const range = selection.getRangeAt(0);
  const highlightId = generateId();
  const highlight = {
      id: highlightId,
      text: selection.toString(),
      page: page,
      color: currentColor.value
  };
  highlights.value.push(highlight);

  const baseHighlightSpan = createHighlightSpan(highlightId, currentColor.value);

  try {
      range.surroundContents(baseHighlightSpan);
  } catch (error) {
      const commonAncestor = range.commonAncestorContainer;
      const walker = document.createTreeWalker(commonAncestor, NodeFilter.SHOW_TEXT, null);
      const nodesToWrap = [];
      while (walker.nextNode()) {
          const node = walker.currentNode;
          if (range.intersectsNode(node)) {
              nodesToWrap.push(node);
          }
      }
      nodesToWrap.forEach(node => {
          let startOffset = 0;
          let endOffset = node.textContent.length;
          if (node === range.startContainer) startOffset = range.startOffset;
          if (node === range.endContainer) endOffset = range.endOffset;
          if (startOffset === endOffset) return;

          const text = node.textContent;
          const beforeText = text.slice(0, startOffset);
          const selectedText = text.slice(startOffset, endOffset);
          const afterText = text.slice(endOffset);
          const beforeNode = document.createTextNode(beforeText);
          const selectedNode = document.createTextNode(selectedText);
          const afterNode = document.createTextNode(afterText);

          const newHighlightSpan = createHighlightSpan(highlightId, currentColor.value);
          newHighlightSpan.textContent = '';
          newHighlightSpan.appendChild(selectedNode);

          const parent = node.parentNode;
          parent.insertBefore(beforeNode, node);
          parent.insertBefore(newHighlightSpan, node);
          parent.insertBefore(afterNode, node);
          parent.removeChild(node);
      });
  }
  selection.removeAllRanges();
}

function deleteHighlight(highlightId) {
    // Remove from highlights array
    highlights.value = highlights.value.filter(h => h.id !== highlightId);
    
    // Get all spans with this highlight ID
    const highlightSpans = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    
    // Process each highlight span
    highlightSpans.forEach(highlightSpan => {
        const parent = highlightSpan.parentNode;
        
        // Insert text content before the highlight span
        const textContent = highlightSpan.textContent;
        const textNode = document.createTextNode(textContent);
        parent.insertBefore(textNode, highlightSpan);
        
        // Remove the highlight span
        parent.removeChild(highlightSpan);
    });
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


.pdf-page :deep(.highlight:hover .highlight-delete-btn) {
    display: flex;
    align-items: center;
    justify-content: center;
}



.pdf-page :deep(.highlight) {
    background-color: var(--highlight-color, yellow);
    opacity: 0.5;
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    transition: opacity 0.2s;
}

.pdf-page :deep(.highlight:hover) {
    opacity: 0.7;
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


.highlight.combined-hover {
  opacity: 0.7 !important;
}
.pdf-page :deep(.highlight.combined-hover) {
    opacity: 0.7;
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

</style>