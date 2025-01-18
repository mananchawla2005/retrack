export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const body = await readBody(event)
        const milestoneParams = [body.id]
        await pool.query("DELETE FROM milestone where id=$1", milestoneParams)
    }
    else {s
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});

