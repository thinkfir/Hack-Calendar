import React, { useState } from 'react';

const TaskGenerator = () => {
  const [projectIdea, setProjectIdea] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hackathonDetails, setHackathonDetails] = useState('');
  const [sleepSchedule, setSleepSchedule] = useState('');
  const [skills, setSkills] = useState('');
  const [tasks, setTasks] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Call the API to generate tasks based on the input
    generateTasks();
  };

  const generateTasks = () => {
    // Here you would implement the logic to call your API
    // For now, we'll just simulate task generation
    const generatedTasks = [
      'Task 1: Research project idea',
      'Task 2: Create project plan',
      'Task 3: Develop initial prototype',
    ];
    setTasks(generatedTasks);
  };

  return (
    <div>
      <h2>Task Generator</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Project Idea:</label>
          <input
            type="text"
            value={projectIdea}
            onChange={(e) => setProjectIdea(e.target.value)}
            required
          />
        </div>
        <div>
          <label>API Key (optional):</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div>
          <label>Hackathon Details:</label>
          <textarea
            value={hackathonDetails}
            onChange={(e) => setHackathonDetails(e.target.value)}
          />
        </div>
        <div>
          <label>Sleep Schedule:</label>
          <input
            type="text"
            value={sleepSchedule}
            onChange={(e) => setSleepSchedule(e.target.value)}
          />
        </div>
        <div>
          <label>Skills:</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <button type="submit">Generate Tasks</button>
      </form>
      <div>
        <h3>Generated Tasks:</h3>
        <ul>
          {tasks.map((task, index) => (
            <li key={index}>{task}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskGenerator;