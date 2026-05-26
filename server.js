const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// In-Memory Array (Yahan temporary data save hoga)
let tasks = [];

// Helper function to calculate Priority Score dynamically
const calculatePriorityScore = (task) => {
    if (task.status === 'completed') return 0.00;

    const now = new Date();
    const due = new Date(task.dueDate);

    const diffTime = due - now;
    let daysUntilDue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 1) daysUntilDue = 1;

    const score = (task.importance * 10) + (100 / daysUntilDue);
    return parseFloat(score.toFixed(2));
};

// --- ROUTES ---

// 1. POST: Create a new task
app.post('/bfhl/tasks', (req, res) => {
    try {
        const { title, description, importance, dueDate, status } = req.body;

        if (!title || !importance || !dueDate) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (importance < 1 || importance > 5) {
            return res.status(400).json({ error: "Importance must be between 1 and 5" });
        }
        if (new Date(dueDate) <= new Date()) {
            return res.status(400).json({ error: "dueDate must be a future date" });
        }

        const newTask = {
            id: Date.now().toString(), // Unique ID generator
            title,
            description: description || '',
            importance: Number(importance),
            dueDate,
            status: status || 'pending',
            createdAt: new Date()
        };

        tasks.push(newTask);

        // Response me score jod kar bhejenge
        res.status(201).json({ ...newTask, priorityScore: calculatePriorityScore(newTask) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2. GET: List all tasks with sorting and filtering
app.get('/bfhl/tasks', (req, res) => {
    try {
        let filteredTasks = [...tasks];

        // Status Filter
        if (req.query.status) {
            filteredTasks = filteredTasks.filter(t => t.status === req.query.status);
        }

        // Min Importance Filter
        if (req.query.minImportance) {
            filteredTasks = filteredTasks.filter(t => t.importance >= parseInt(req.query.minImportance));
        }

        // Har task ka score on-the-fly calculate karo
        let taskWithScores = filteredTasks.map(t => ({
            ...t,
            priorityScore: calculatePriorityScore(t)
        }));

        // High score wale tasks sabse upar (Sorting)
        taskWithScores.sort((a, b) => b.priorityScore - a.priorityScore);

        res.status(200).json(taskWithScores);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 3. GET /bfhl/tasks/stats (Dashboard Analytics)
app.get('/bfhl/tasks/stats', (req, res) => {
    try {
        const now = new Date();
        const totalTasks = tasks.length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;

        const overdueTasks = tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < now).length;

        const totalImportance = tasks.reduce((sum, t) => sum + t.importance, 0);
        const averageImportance = totalTasks > 0 ? parseFloat((totalImportance / totalTasks).toFixed(2)) : 0;

        const tasksByImportance = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
        tasks.forEach(t => {
            if (tasksByImportance[t.importance] !== undefined) {
                tasksByImportance[t.importance]++;
            }
        });

        res.json({
            totalTasks,
            pendingTasks,
            completedTasks,
            averageImportance,
            overdueTasks,
            tasksByImportance
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. PATCH: Update task status or details
app.patch('/bfhl/tasks/:id', (req, res) => {
    try {
        const taskIndex = tasks.findIndex(t => t.id === req.params.id);
        if (taskIndex === -1) return res.status(404).json({ error: "Task not found" });

        tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
        const updatedTask = tasks[taskIndex];

        res.status(200).json({ ...updatedTask, priorityScore: calculatePriorityScore(updatedTask) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 5. DELETE: Delete a task
app.delete('/bfhl/tasks/:id', (req, res) => {
    try {
        const taskIndex = tasks.findIndex(t => t.id === req.params.id);
        if (taskIndex === -1) return res.status(404).json({ error: "Task not found" });

        tasks.splice(taskIndex, 1);
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));