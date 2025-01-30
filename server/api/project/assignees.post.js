export default defineEventHandler(async (event) => {
	if (event.context.user) {
        const body = await readBody(event)
        console.log(body, event.context.user.id)
        const result = await pool.query('SELECT user_id, name from project_team JOIN auth_user ON user_id=auth_user.id where project_id = $1', [body.projectId])
        console.log(result.rows)
        return {
            users: result.rows
        }
    }
	else {
		throw createError({
			message: "Unauthorised Access not allowed",
			statusCode: 401
		});
    }
});
