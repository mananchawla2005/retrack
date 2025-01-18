function timestampToDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}
export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const projectId = (await readBody(event)).projectId
        const params = [projectId]
        const result = await pool.query("Select * from project where id=$1", params)
        return {
            projectName: result.rows[0].name,
            inviteCode: result.rows[0].invite_code,
            keywords: result.rows[0].keywords,
            description: result.rows[0].description,
            createdOn: timestampToDate(result.rows[0].created_on)
        }
    }
    else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});

