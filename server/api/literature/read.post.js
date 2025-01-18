export default defineEventHandler(async (event)=>{
    if (event.context.user) {
    const urlId = (await readBody(event)).urlId
    await pool.query('Update literature set read = NOT read where url_id=$1', [urlId])
    }
    else{
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
})