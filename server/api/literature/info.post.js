export default defineEventHandler(async (event)=>{
    if (event.context.user) {
    const userId = event.context.user.id
    const data = await pool.query('select * from literature where user_id=$1', [userId])
    console.log(data.rows)
    return data.rows
    }
    else{
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
})