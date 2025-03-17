export default defineEventHandler(async (event) => {
    if (event.context.user) {
        try {
            const userId = event.context.user.id;

            // Get task statistics for assigned tasks
            const taskStats = await pool.query(`
                SELECT 
                    COUNT(CASE WHEN t.completed = true THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN t.completed = false OR t.completed IS NULL THEN 1 END) as pending_tasks,
                    COUNT(*) as total_tasks
                FROM task t
                JOIN task_assignees ta ON t.id = ta.task_id
                WHERE ta.user_id = $1
            `, [userId]);

            // Get active projects count
            const projectCount = await pool.query(`
                SELECT COUNT(DISTINCT p.id) as active_projects
                FROM project p
                JOIN project_team pt ON p.id = pt.project_id
                WHERE pt.user_id = $1
            `, [userId]);

            // Get priority distribution of assigned tasks
            const priorityStats = await pool.query(`
                SELECT 
                    t.label as priority,
                    COUNT(*) as count
                FROM task t
                JOIN task_assignees ta ON t.id = ta.task_id
                WHERE ta.user_id = $1
                GROUP BY t.label
            `, [userId]);

            // Get timeline of assigned tasks and their milestones
            const timelineItems = await pool.query(`
                WITH user_tasks AS (
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
                    JOIN task_assignees ta ON t.id = ta.task_id
                    JOIN milestone m ON t.milestone_id = m.id
                    JOIN project p ON m.project_id = p.id
                    WHERE ta.user_id = $1
                    
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
                    WHERE EXISTS (
                        SELECT 1 FROM task t
                        JOIN task_assignees ta ON t.id = ta.task_id
                        WHERE t.milestone_id = m.id AND ta.user_id = $1
                    )
                )
                SELECT * FROM user_tasks
                ORDER BY date DESC
                LIMIT 20
            `, [userId]);

            // Get upcoming deadlines
            const upcomingDeadlines = await pool.query(`
                SELECT 
                    t.id,
                    t.name,
                    t.deadline as date,
                    t.label as priority,
                    p.name as project_name,
                    t.completed
                FROM task t
                JOIN task_assignees ta ON t.id = ta.task_id
                JOIN milestone m ON t.milestone_id = m.id
                JOIN project p ON m.project_id = p.id
                WHERE ta.user_id = $1
                AND t.deadline >= CURRENT_DATE
                AND (t.completed = false OR t.completed IS NULL)  -- Add this line to filter out completed tasks
                ORDER BY t.deadline ASC
                LIMIT 10
            `, [userId]);

            // Get user's projects and roles
            const projectsQuery = await pool.query(`
                SELECT 
                    p.id,
                    p.name,
                    pt.role
                FROM project p
                JOIN project_team pt ON p.id = pt.project_id
                WHERE pt.user_id = $1
                ORDER BY p.name
            `, [userId]);

            return {
                taskStats: taskStats.rows[0],
                activeProjects: projectCount.rows[0].active_projects,
                priorityDistribution: priorityStats.rows,
                timeline: timelineItems.rows,
                upcomingDeadlines: upcomingDeadlines.rows,
                projects: projectsQuery.rows  // Add this line
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw createError({
                message: "Failed to fetch user statistics",
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
