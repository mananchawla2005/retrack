export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({
            message: "Unauthorized access not allowed",
            statusCode: 401
        });
    }

    const body = await readBody(event);
    const { urlId } = body;
    const userId = event.context.user.id;

    try {
        // Get highlights with coordinates for this user only
        const highlightsResult = await pool.query(
            'SELECT highlight_id as id, page, color, coordinates FROM highlights WHERE url_id = $1 AND user_id = $2',
            [urlId, userId]
        );

        // Get drawings for this user only
        const drawingsResult = await pool.query(
            'SELECT page_number, drawing_data FROM page_drawings WHERE url_id = $1 AND user_id = $2',
            [urlId, userId]
        );

        // Convert drawings to map format
        const pageDrawings = {};
        drawingsResult.rows.forEach(row => {
            pageDrawings[row.page_number] = row.drawing_data;
        });

        return {
            highlights: highlightsResult.rows,
            pageDrawings
        };
    } catch (error) {
        console.error('Error loading annotations:', error);
        throw createError({
            message: "Failed to load annotations",
            statusCode: 500
        });
    }
});
