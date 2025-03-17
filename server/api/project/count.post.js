export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }

    const userId = event.context.user.id;
    const query = `
        SELECT COUNT(p.id)
        FROM project p 
        INNER JOIN project_team pm ON p.id = pm.project_id 
        WHERE pm.user_id = $1
    `;
    
    try {
        const result = await pool.query(query, [userId]);
        return {
            count: result.rows[0].count
        };
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw createError({
            message: "Failed to fetch projects",
            statusCode: 500
        });
    }
});
