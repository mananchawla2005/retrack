import { createError } from 'h3'
import { Readable } from 'stream'

export default defineEventHandler(async (event) => {
  const id = event.context.params.id

  try {
    // Fetch raw PDF from Azure
    const response = await $fetch(`https://pdfretrack.blob.core.windows.net/files/${id}.pdf`)
    // Read PDF as ArrayBuffer
    const buffer = await response.arrayBuffer()
    console.log(buffer)
    const stream = Readable.from(Buffer.from(buffer))
    event.node.res.setHeader('Content-Type', 'application/pdf')
    event.node.res.setHeader('Content-Length', buffer.byteLength)
    return sendStream(event, stream)
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching PDF'
    })
  }
})