import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Local backend URL jo port 5000 par chal raha hai
const API_BASE_URL = 'https://taskflow-bajaj-assessment.onrender.com/bfhl/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('');
  const [minImportance, setMinImportance] = useState('');

  // Fetch Tasks and Stats from Backend
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}`;
      const params = [];
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (minImportance) params.push(`minImportance=${minImportance}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const tasksRes = await axios.get(url);
      setTasks(tasksRes.data);

      const statsRes = await axios.get(`${API_BASE_URL}/stats`);
      setStats(statsRes.data);
    } catch (err) {
      setError('Server se data nahi aa raha hai. Check karein backend running hai ya nahi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, minImportance]);

  // Create Task Handler
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError('');
    try {
      await axios.post(API_BASE_URL, { title, description, importance: Number(importance), dueDate });
      setTitle('');
      setDescription('');
      setImportance(1);
      setDueDate('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Task create karne me error hai');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Mark Task Complete Handler
  const handleMarkComplete = async (id) => {
    try {
      await axios.patch(`${API_BASE_URL}/${id}`, { status: 'completed' });
      fetchData();
    } catch (err) {
      setError('Status update nahi ho paya');
    }
  };

  // Delete Task Handler
  const handleDelete = async (id) => {
    if (window.confirm('Kya aap is task ko delete karna chahte hain?')) {
      try {
        await axios.delete(`${API_BASE_URL}/${id}`);
        fetchData();
      } catch (err) {
        setError('Task delete nahi ho paya');
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>TaskFlow: Smart Task Manager</h2>

      {error && <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', marginBottom: '20px' }}>{error}</div>}

      {/* Stats Dashboard */}
      {stats && (
        <div style={{ background: '#f0f4f8', padding: '10px', borderRadius: '5px', marginBottom: '20px', display: 'flex', justifyContent: 'space-around' }}>
          <div><strong>Total Tasks:</strong> {stats.totalTasks}</div>
          <div><strong>Pending:</strong> {stats.pendingTasks}</div>
          <div><strong>Completed:</strong> {stats.completedTasks}</div>
          <div><strong>Avg Importance:</strong> {stats.averageImportance}</div>
          <div style={{ color: stats.overdueTasks > 0 ? 'red' : 'black' }}><strong>Overdue:</strong> {stats.overdueTasks}</div>
        </div>
      )}

      {/* Form */}
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>Add New Task</h3>
        <form onSubmit={handleCreateTask}>
          <div style={{ marginBottom: '10px' }}>
            <label>Title: </label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '5px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Description: </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div style={{ marginBottom: '10px', display: 'flex', gap: '20px' }}>
            <div>
              <label>Importance (1-5): </label>
              <select value={importance} onChange={e => setImportance(e.target.value)} style={{ padding: '5px' }}>
                {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>
            <div>
              <label>Due Date: </label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={{ padding: '5px' }} />
            </div>
          </div>
          <button type="submit" disabled={formSubmitting} style={{ padding: '5px 15px', cursor: 'pointer' }}>
            {formSubmitting ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '25px' }}>
        <div>
          <label>Filter Status: </label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '5px' }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label>Min Importance: </label>
          <input type="number" min="1" max="5" value={minImportance} onChange={e => setMinImportance(e.target.value)} placeholder="1-5" style={{ padding: '5px', width: '60px' }} />
        </div>
      </div>

      {/* Tasks List */}
      {loading && <p>Loading tasks...</p>}

      {!loading && tasks.length === 0 ? (
        <p style={{ color: '#666' }}>No tasks available.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {tasks.map(task => {
            const isHighPriority = task.priorityScore >= 50;
            return (
              <div key={task.id} style={{
                padding: '12px',
                borderRadius: '5px',
                border: isHighPriority ? '2px solid red' : '1px solid #ccc',
                backgroundColor: isHighPriority ? '#fff5f5' : '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>
                      {task.title} {isHighPriority && <span style={{ background: 'red', color: 'white', fontSize: '10px', padding: '2px 5px', borderRadius: '3px' }}>High Priority</span>}
                    </h4>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#444' }}>{task.description}</p>
                    <small style={{ color: '#666' }}>⭐ Importance: {task.importance} | 📅 Due: {new Date(task.dueDate).toLocaleDateString()} | Status: <strong>{task.status}</strong></small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>Score: {task.priorityScore}</div>
                    <div style={{ marginTop: '5px' }}>
                      {task.status === 'pending' && (
                        <button onClick={() => handleMarkComplete(task.id)} style={{ fontSize: '11px', marginRight: '5px', cursor: 'pointer' }}>Complete</button>
                      )}
                      <button onClick={() => handleDelete(task.id)} style={{ fontSize: '11px', cursor: 'pointer', color: 'red' }}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;