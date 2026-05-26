const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS ko open kiya taaki Vercel frontend bina kisi error ke connect ho sake
app.use(cors());
app.use(express.json());

// In-memory array tasks store karne ke liye (Kyunki database nahi use kar rahe)
let tasks = [];

// 1. Root route - Agar koi direct link khole toh "Cannot GET /" na aaye
app.get('/', (req, res) => {
    res.send('Taskflow Bajaj Assessment Backend is Running Successfully!');
});

// 2. GET Route - Saare tasks fetch karne ke liye
app.get('/bfhl/tasks', (req, res) => {
    res.status(200).json(tasks);
});

// 3. POST Route - Naya task add karne ke liye
app.post('/bfhl/tasks', (req, res) => {
    const { title, description, importance, dueDate } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const newTask = {
        id: Date.now().toString(),
        title,
        description: description || '',
        importance: parseInt(importance) || 1,
        dueDate: dueDate || '',
        status: 'pending'
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// 4. GET Route - Stats calculation ke liye
app.get('/bfhl/tasks/stats', (req, res) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;

    res.status(200).json({
        totalTasks,
        completedTasks,
        pendingTasks
    });
});

// Server Start
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});