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
        const milestoneParams = [body.name, getTimestamp(body.deadline), body.id]
        await pool.query("UPDATE milestone SET name=$1, deadline=$2 where id=$3", milestoneParams)
        const milestoneId = body.id
        const client = await pool.connect()
        const taskIds = []
        try {
            await client.query('BEGIN')
            const newTaskIds = body.tasks.map(task => task.id).filter(id => id);
            if (newTaskIds.length > 0) {
                await client.query(
                    "DELETE FROM task WHERE milestone_id = $1 AND id NOT IN (SELECT unnest($2::uuid[]))",
                    [milestoneId, newTaskIds]
                );
            } else {
                await client.query("DELETE FROM task WHERE milestone_id = $1", [milestoneId]);
            }
            for (const task of body.tasks) {
                const queryText = task.id
                    ? `UPDATE task 
                       SET name = $2, 
                           deadline = $3, 
                           label = $4
                        WHERE id = $1
                       `
                    : `INSERT INTO task (name, deadline, label, milestone_id) 
                       VALUES ($1, $2, $3, $4) 
                       RETURNING id`;

                const params = task.id
                    ? [task.id, task.name, getTimestamp(task.deadline), task.priority]
                    : [task.name, getTimestamp(task.deadline), task.priority, milestoneId];

                const res = await client.query(queryText, params);
                if (res.rows.length > 0) {
                    taskIds.push(res.rows[0].id);
                }
                // Delete existing assignees for updated tasks
                if (task.id) {
                    await client.query("DELETE FROM task_assignees WHERE task_id = $1", [task.id]);
                }

                // Insert new assignees
                const taskId = task.id || res.rows[0].id;
                for (const assigneeId of task.assignedTo) {
                    await client.query("INSERT INTO task_assignees VALUES($1, $2)", [taskId, assigneeId]);
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

