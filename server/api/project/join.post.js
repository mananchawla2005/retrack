export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const inviteCode = (await readBody(event)).inviteCode
        const params = [inviteCode]
        const result = await pool.query("Select id from project where invite_code=$1", params)
        if(result.rows.length!==1){
            throw createError({
                message: "Invalid Invite code",
                statusCode: 404
            });
        }
        const projectId = result.rows[0].id
        await pool.query('INSERT INTO project_team VALUES($1, $2, $3)', [projectId, event.context.user.id, 'member'])
        return {
            projectId: projectId
        }
    }
    else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});

