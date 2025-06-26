import React, { useState } from 'react';
import axios from 'axios';

const TaskGenerator = () => {
  const [projectIdea, setProjectIdea] = useState('');
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('/api/hackathons/generate-tasks', {
        projectIdea,
        // Optionally include provider and apiKey if needed
      });
      setTasks(response.data);
    } catch (err) {
      setError('Error generating tasks. Please try again.');
    }
  };

  return (
    <div>
      <h2>Generate Tasks</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={projectIdea}
          onChange={(e) => setProjectIdea(e.target.value)}
          placeholder="Enter your project idea"
          required
        />
        <button type="submit">Generate Tasks</button>
      </form>
      {error && <p>{error}</p>}
      <ul>
        {tasks.map((task, index) => (
          <li key={index}>{task.title} - {task.phase}</li>
        ))}
      </ul>
    </div>
  );
};

export default TaskGenerator;