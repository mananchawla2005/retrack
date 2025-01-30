import { BlobServiceClient } from "@azure/storage-blob"
import { generateIdFromEntropySize } from "lucia"

async function fetchArxivData(arxivId) {
    const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
    const pdfUrl = `http://arxiv.org/pdf/${arxivId}.pdf`;

    try {
        // Fetch metadata
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();

        // Extract authors
        const authorMatches = [...data.matchAll(/<author>\s*<name>(.*?)<\/name>\s*<\/author>/g)];
        const authors = authorMatches.map(match => match[1]);
        // Extract title
        const titleMatch = data.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(/\n/g, '').trim() : 'Unknown Title';

        // Fetch PDF
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
            throw new Error(`HTTP error! status: ${pdfResponse.status}`);
        }
        const pdfBlob = await pdfResponse.blob();

        // Create file-like object with metadata
        const file = new File([pdfBlob], `${arxivId}.pdf`, { type: 'application/pdf' });

        return {
            authors,
            title,
            file,
        };
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const formData = await readFormData(event)
        const source = formData.get('source')
        const userId = event.context.user.id
        var file, title, authors
        if(source=='arXiv'){
            const arxivId = formData.get('arxivId')
            const arxivData = await fetchArxivData(arxivId)
            file = arxivData.file
            title = arxivData.title
            authors = arxivData.authors.join(', ')
        }
        else {
            file = formData.get("file")
            title = formData.get('title')
            authors = formData.get('authors')
        }
        const uploadDate = formData.get('upload_date')
        const read = formData.get('read')
        const fileId = generateIdFromEntropySize(6)
        const buffer = Buffer.from(await file.arrayBuffer())
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            useRuntimeConfig().azureStorageConnectionString
        )
        const blobId = userId + '_' + fileId
        const blobName = blobId + '.pdf'
        const containerClient = blobServiceClient.getContainerClient('files');
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        console.log(
            `\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`
        )
        const uploadBlobResponse = await blockBlobClient.uploadData(buffer)
        await pool.query('INSERT INTO LITERATURE(url_id, title, authors, source, read, user_id, upload_date) VALUES($1, $2, $3, $4, $5, $6, $7)', [blobId, title, authors, source, read, userId, uploadDate])
        return {
            title: title,
            authors: authors,
            urlId: blobId,
            status: uploadBlobResponse.requestId ? 'success' : 'error'
        }
    }
    else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }

})