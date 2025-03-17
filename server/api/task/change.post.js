export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const body = await readBody(event);
        const params = [body.taskId, body.completed];
        
        try {
            await pool.query(
                "UPDATE task SET completed = $2 WHERE id = $1",
                params
            );

            return {
                success: true,
                message: "Task completion status updated successfully"
            };
        } catch (error) {
            console.error('Error updating task completion status:', error);
            throw createError({
                message: "Failed to update task completion status",
                statusCode: 500
            });
        }
    } else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});
