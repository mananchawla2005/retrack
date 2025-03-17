export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }

    const userId = event.context.user.id;
    const query = `
        SELECT p.id, p.name 
        FROM project p 
        INNER JOIN project_team pm ON p.id = pm.project_id 
        WHERE pm.user_id = $1
    `;
    
    try {
        const result = await pool.query(query, [userId]);
        return {
            projects: result.rows
        };
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw createError({
            message: "Failed to fetch projects",
            statusCode: 500
        });
    }
});
