import { generateIdFromEntropySize } from 'lucia'

async function generateUniqueInviteCode() {
    let isUnique = false;
    let inviteCode;

    while (!isUnique) {
        inviteCode = generateIdFromEntropySize(10)
        const result = await pool.query(
            'SELECT COUNT(*) FROM project WHERE invite_code = $1',
            [inviteCode]
        );

        if (parseInt(result.rows[0].count, 10) === 0) {
            isUnique = true;
        }
    }

    return inviteCode;
}

export default defineEventHandler(async (event) => {
	if (event.context.user) {
		const userId = event.context.user.id;
        const inviteCode = await generateUniqueInviteCode()
        const body = await readBody(event)
        const params = [inviteCode, body.keywords, body.description, body.projectName]
        const result = await pool.query("INSERT INTO project(invite_code, keywords, description, name) VALUES($1, $2, $3, $4) returning id", params)
        await pool.query("INSERT INTO project_team(project_id, user_id, role) VALUES($1, $2, $3)", [result.rows[0].id, userId, 'member'])
        return {
            projectId: result.rows[0].id,
            inviteCode: inviteCode
        }
    }
	else {
		throw createError({
			message: "Unauthorised Access not allowed",
			statusCode: 401
		});
    }
});

