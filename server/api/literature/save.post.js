export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({
            message: "Unauthorized access not allowed",
            statusCode: 401
        });
    }

    const body = await readBody(event);
    const { urlId, highlights, pageDrawings } = body;
    const userId = event.context.user.id;

    try {
        // Delete existing highlights and drawings for this user only
        await pool.query('DELETE FROM highlights WHERE url_id = $1 AND user_id = $2', [urlId, userId]);
        await pool.query('DELETE FROM page_drawings WHERE url_id = $1 AND user_id = $2', [urlId, userId]);

        // Insert new highlights with coordinates and user_id
        if (highlights && highlights.length > 0) {
            const highlightValues = highlights.map(h => 
                `('${urlId}', '${h.id}', ${h.page}, '${h.color}', '${JSON.stringify(h.coordinates)}', '${userId}')`
            ).join(',');
            await pool.query(`
                INSERT INTO highlights (url_id, highlight_id, page, color, coordinates, user_id)
                VALUES ${highlightValues}
            `);
        }

        // Insert page drawings with user_id
        if (pageDrawings && Object.keys(pageDrawings).length > 0) {
            const drawingValues = Object.entries(pageDrawings).map(([page, data]) =>
                `('${urlId}', ${page}, '${JSON.stringify(data)}', '${userId}')`
            ).join(',');
            await pool.query(`
                INSERT INTO page_drawings (url_id, page_number, drawing_data, user_id)
                VALUES ${drawingValues}
            `);
        }

        return { status: 'success' };
    } catch (error) {
        console.error('Error saving annotations:', error);
        throw createError({
            message: "Failed to save annotations",
            statusCode: 500
        });
    }
});
