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
        const result = await pool.query("Select * from milestone where project_id=$1", params)
        const milestones = []
        for (let index = 0; index < result.rows.length; index++) {
            const element = result.rows[index]
            const id = element.id
            const name = element.name
            const deadline = timestampToDate(element.deadline)
            const taskResult = await pool.query("Select * from task where milestone_id=$1", [id])
            const tasks = []
            for (let index2 = 0; index2 < taskResult.rows.length; index2++) {
                const element2 = taskResult.rows[index2]
                var assigneeData = await pool.query("SELECT user_id from task_assignees where task_id=$1", [element2.id])
                const assignedToIds = []
                assigneeData.rows.forEach(x => {
                    assignedToIds.push(x.user_id)
                });

                // Fetch linked literature
                const literatureData = await pool.query(`
                    SELECT l.* 
                    FROM literature l
                    JOIN task_literature tl ON l.url_id = tl.url_id
                    WHERE tl.task_id = $1
                `, [element2.id]);
                
                tasks.push({
                    id: element2.id,
                    name: element2.name,
                    deadline: timestampToDate(element2.deadline),
                    assignedTo: assignedToIds,
                    priority: element2.label,
                    literature: literatureData.rows,
                    completed: element2.completed || false,  // Add this line
                    editMode: false
                })
            }
            milestones.push({
                id: element.id,
                name: name,
                deadline: deadline,
                tasks: tasks
            })

            
        }
        return {
            milestones: milestones
        }
    }
    else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});

