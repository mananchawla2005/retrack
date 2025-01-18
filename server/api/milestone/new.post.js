function getTimestamp(myDate) {
    // Validate YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(myDate)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
    
    // For Postgres timestamp, return ISO string
    return `${myDate}T00:00:00.000Z`;
}
export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const body = await readBody(event)
        const milestoneParams = [body.name, getTimestamp(body.deadline), body.projectId]
        const milestoneResult = await pool.query("INSERT INTO milestone(name, deadline, project_id) VALUES($1, $2, $3) returning id", milestoneParams)
        const milestoneId = milestoneResult.rows[0].id
        const client = await pool.connect()
        const taskIds = []
        try {
            await client.query('BEGIN')
            for (let index = 0; index < body.tasks.length; index++) {
                const element = body.tasks[index]
                
                const queryText = 'INSERT INTO task(name, deadline, label, milestone_id) VALUES($1, $2, $3, $4) RETURNING id'
                const res = await client.query(queryText, [element.name, getTimestamp(element.deadline), element.priority, milestoneId])
                taskIds.push(res.rows[0].id)
                for (let index2 = 0; index2 < element.assignedTo.length; index2++) {
                    const element2 = element.assignedTo[index2];
                    await client.query("INSERT INTO task_assignees VALUES($1, $2)", [res.rows[0].id, element2])
                }
            }
            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
        /* to be done after implementing assigning facility */
        // const aclient = await pool.connect()
        // try {
        //     await aclient.query('BEGIN')
        //     for (let index = 0; index < body.task.length; index++) {
        //         const element = array[index]
        //         const queryText = 'INSERT INTO task_assignees(name, deadline, label, milestone_id) VALUES($1, $2, $3, $4) RETURNING id'
        //         await client.query(queryText, [element.name, element.deadline, element.priority, milestoneId])
        //     }
        //     await aclient.query('COMMIT')
        // } catch (e) {
        //     await aclient.query('ROLLBACK')
        //     throw e
        // } finally {
        //     aclient.release()
        // }
        return {
            milestoneId: milestoneId,
            taskIds: taskIds
        }
    }
    else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});

