export default defineEventHandler(async (event) => {
    if (event.context.user) {
        try {
            // Get task statistics
            const taskStats = await pool.query(`
                SELECT 
                    COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN completed = false OR completed IS NULL THEN 1 END) as pending_tasks,
                    COUNT(*) as total_tasks
                FROM task
                WHERE milestone_id IN (
                    SELECT id FROM milestone 
                    WHERE project_id IN (
                        SELECT project_id FROM project_team 
                        WHERE user_id = $1
                    )
                )
            `, [event.context.user.id]);

            // Get priority distribution
            const priorityStats = await pool.query(`
                SELECT 
                    label as priority,
                    COUNT(*) as count
                FROM task
                WHERE milestone_id IN (
                    SELECT id FROM milestone 
                    WHERE project_id IN (
                        SELECT project_id FROM project_team 
                        WHERE user_id = $1
                    )
                )
                GROUP BY label
            `, [event.context.user.id]);

            // Get recent timeline items (tasks and milestones)
            const timelineItems = await pool.query(`
                WITH timeline AS (
                    SELECT 
                        'task' as type,
                        t.id,
                        t.name,
                        t.deadline as date,
                        t.completed,
                        t.label as priority,
                        m.name as milestone_name,
                        p.name as project_name
                    FROM task t
                    JOIN milestone m ON t.milestone_id = m.id
                    JOIN project p ON m.project_id = p.id
                    WHERE m.project_id IN (
                        SELECT project_id FROM project_team 
                        WHERE user_id = $1
                    )
                    UNION ALL
                    SELECT 
                        'milestone' as type,
                        m.id,
                        m.name,
                        m.deadline as date,
                        NULL as completed,
                        NULL as priority,
                        NULL as milestone_name,
                        p.name as project_name
                    FROM milestone m
                    JOIN project p ON m.project_id = p.id
                    WHERE m.project_id IN (
                        SELECT project_id FROM project_team 
                        WHERE user_id = $1
                    )
                )
                SELECT *
                FROM timeline
                ORDER BY date DESC
                LIMIT 20
            `, [event.context.user.id]);

            return {
                taskStats: taskStats.rows[0],
                priorityDistribution: priorityStats.rows,
                timeline: timelineItems.rows
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw createError({
                message: "Failed to fetch statistics",
                statusCode: 500
            });
        }
    } else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});
