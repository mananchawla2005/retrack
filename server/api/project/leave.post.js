export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const projectId = (await readBody(event)).projectId
        await pool.query('DELETE FROM project_team WHERE project_id=$1 AND user_id=$2', [projectId, event.context.user.id])
        return {
            success: true
        }
    } else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});
