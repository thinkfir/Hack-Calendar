// HackManager - Main JavaScript File

// Application State
const app = {
    // Current page
    currentPage: 'ai-assistant',
    
    // Hackathon settings
    hackathonSettings: {
        name: '',
        startDate: null,
        duration: null // in hours
    },
    
    // Team members array
    teamMembers: [],
    
    // All tasks array
    allTasks: [],
    
    // Calendar data structure
    calendarData: {
        days: [],
        currentView: 'week' // 'week' or 'month'
    }
};

// DOM Elements (will be populated after DOMContentLoaded)
const elements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('HackManager initialized');
    
    // Cache DOM elements
    cacheElements();
    
    // Set up event listeners
    initializeEventListeners();
    
    // Initialize application
    initializeApp();
});

// Cache frequently used DOM elements
function cacheElements() {
    // Navigation
    elements.navLinks = document.querySelectorAll('.nav-link');
    elements.pages = document.querySelectorAll('.page');
    
    // AI Assistant Page
    elements.projectIdeaInput = document.getElementById('project-idea-input');
    elements.generateTasksBtn = document.getElementById('generate-tasks-btn');
    elements.aiResponse = document.getElementById('ai-response');
    
    // Calendar Page
    elements.calendarContainer = document.getElementById('calendar-container');
    elements.tasksList = document.getElementById('tasks-list');
    
    // Team Page
    elements.teamMembersList = document.getElementById('team-members-list');
    elements.addMemberBtn = document.getElementById('add-member-btn');
    elements.teamStats = document.getElementById('team-stats');
    
    // Settings Page
    elements.settingsForm = document.getElementById('settings-form');
    elements.hackathonName = document.getElementById('hackathon-name');
    elements.startDate = document.getElementById('start-date');
    elements.duration = document.getElementById('duration');
    
    // Modal
    elements.taskModal = document.getElementById('task-modal');
}

// Initialize event listeners
function initializeEventListeners() {
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // AI Assistant
    if (elements.generateTasksBtn) {
        elements.generateTasksBtn.addEventListener('click', generateTasksFromIdea);
    }
    
    // Team Management
    if (elements.addMemberBtn) {
        elements.addMemberBtn.addEventListener('click', handleAddMember);
    }
    
    // Settings Form
    if (elements.settingsForm) {
        elements.settingsForm.addEventListener('submit', handleSettingsSubmit);
    }
}

// Initialize the application
function initializeApp() {
    // Load data from local storage
    loadFromLocalStorage();
    
    // Show the default page
    showPage('ai-assistant');
    
    // Initialize components
    updateTeamStats();
}

// ========== Navigation Functions ==========

// Handle navigation between pages
function handleNavigation(e) {
    e.preventDefault();
    const targetPage = e.currentTarget.getAttribute('data-page');
    showPage(targetPage);
}

// Show a specific page
function showPage(pageId) {
    // Update active nav link
    elements.navLinks.forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update active page
    elements.pages.forEach(page => {
        if (page.id === `${pageId}-page`) {
            page.classList.add('active');
            page.classList.remove('hidden');
        } else {
            page.classList.remove('active');
            page.classList.add('hidden');
        }
    });
    
    // Update current page in state
    app.currentPage = pageId;
    
    // Page-specific initialization
    if (pageId === 'calendar') {
        renderCalendar();
        renderTasks();
    } else if (pageId === 'team') {
        renderTeamMembers();
        updateTeamStats();
    }
}

// ========== Hackathon Settings Functions ==========

// Handle settings form submission
function handleSettingsSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const name = elements.hackathonName.value;
    const startDateValue = elements.startDate.value;
    const duration = parseInt(elements.duration.value);
    
    if (!name || !startDateValue || !duration) {
        alert('Please fill in all fields');
        return;
    }
    
    const startDate = new Date(startDateValue);
    
    // Save settings
    saveHackathonSettings(name, startDate, duration);
    
    // Show success message
    alert('Settings saved successfully!');
}

// Save hackathon settings
function saveHackathonSettings(name, startDate, duration) {
    app.hackathonSettings.name = name;
    app.hackathonSettings.startDate = startDate;
    app.hackathonSettings.duration = duration;
    
    // Save to local storage
    saveToLocalStorage();
}

// Validate hackathon settings
function validateHackathonSettings() {
    return app.hackathonSettings.startDate && app.hackathonSettings.duration;
}

// ========== Team Member Functions ==========

// Handle add member button click
function handleAddMember() {
    const name = prompt('Enter team member name:');
    if (name) {
        addTeamMember(name);
    }
}

// Add a new team member
function addTeamMember(name) {
    const member = {
        id: generateId(),
        name: name,
        colorIndex: app.teamMembers.length % 8
    };
    
    app.teamMembers.push(member);
    saveToLocalStorage();
    renderTeamMembers();
    updateTeamStats();
}

// Remove a team member
function removeTeamMember(id) {
    app.teamMembers = app.teamMembers.filter(member => member.id !== id);
    
    // Unassign tasks from this member
    app.allTasks.forEach(task => {
        if (task.assignedTo === id) {
            task.assignedTo = null;
        }
    });
    
    saveToLocalStorage();
    renderTeamMembers();
    updateTeamStats();
    
    // Re-render tasks if on calendar page
    if (app.currentPage === 'calendar') {
        renderTasks();
    }
}

// Update team member details
function updateTeamMember(id, updates) {
    const memberIndex = app.teamMembers.findIndex(m => m.id === id);
    if (memberIndex !== -1) {
        app.teamMembers[memberIndex] = { ...app.teamMembers[memberIndex], ...updates };
        saveToLocalStorage();
        renderTeamMembers();
    }
}

// Render team members list
function renderTeamMembers() {
    if (!elements.teamMembersList) return;
    
    elements.teamMembersList.innerHTML = '';
    
    app.teamMembers.forEach((member, index) => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        memberDiv.innerHTML = `
            <div class="flex items-center">
                <span class="team-badge team-member-${member.colorIndex + 1}">${member.name}</span>
            </div>
            <button onclick="removeTeamMember('${member.id}')" class="text-red-500 hover:text-red-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        elements.teamMembersList.appendChild(memberDiv);
    });
}

// Update team statistics
function updateTeamStats() {
    if (!elements.teamStats) return;
    
    elements.teamStats.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between">
                <span class="text-gray-600">Total Members:</span>
                <span class="font-semibold">${app.teamMembers.length}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Total Tasks:</span>
                <span class="font-semibold">${app.allTasks.length}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Unassigned Tasks:</span>
                <span class="font-semibold">${app.allTasks.filter(t => !t.assignedTo).length}</span>
            </div>
        </div>
    `;
}

// ========== Project Idea Functions ==========

// Save project idea
function saveProjectIdea(idea) {
    app.projectIdea = idea;
    saveToLocalStorage();
}

// Generate tasks from project idea
function generateTasksFromIdea() {
    const idea = elements.projectIdeaInput.value.trim();
    
    if (!idea) {
        alert('Please enter a project idea first.');
        return;
    }
    
    if (!validateHackathonSettings()) {
        alert('Please configure hackathon settings first (go to Settings page).');
        showPage('settings');
        return;
    }
    
    if (app.teamMembers.length === 0) {
        alert('Please add at least one team member first (go to Team Setup page).');
        showPage('team');
        return;
    }
    
    // Save the project idea
    saveProjectIdea(idea);
    
    // Show loading state
    elements.aiResponse.innerHTML = '<p class="text-gray-600">🤖 AI is analyzing your project idea and generating a comprehensive task breakdown...</p>';
    elements.aiResponse.classList.remove('hidden');
    
    // Simulate AI processing time
    setTimeout(() => {
        // Clear existing tasks
        app.allTasks = [];
        
        // Generate tasks based on project phases
        const generatedTasks = generateProjectTasks(idea);
        
        // Add all tasks to the app
        generatedTasks.forEach(task => createTask(task));
        
        // Display results
        displayGeneratedTasks(generatedTasks);
        
        // Update team stats
        updateTeamStats();
        
    }, 1500);
}

// AI-powered task generation based on project idea
function generateProjectTasks(projectIdea) {
    const tasks = [];
    const startDate = new Date(app.hackathonSettings.startDate);
    const totalHours = app.hackathonSettings.duration;
    const teamSize = app.teamMembers.length;
    
    // Analyze project complexity based on keywords
    const isWebApp = /web|website|app|application|platform|portal/i.test(projectIdea);
    const isMobile = /mobile|android|ios|app/i.test(projectIdea);
    const hasBackend = /backend|api|database|server|auth|login/i.test(projectIdea);
    const hasAI = /ai|machine learning|ml|neural|nlp|computer vision/i.test(projectIdea);
    const hasData = /data|analytics|visualization|dashboard/i.test(projectIdea);
    
    // Calculate time allocation (as percentage of total time)
    const timeAllocation = {
        planning: 0.10,      // 10% for planning
        design: 0.15,        // 15% for design
        development: 0.50,   // 50% for core development
        integration: 0.10,   // 10% for integration
        testing: 0.10,      // 10% for testing
        presentation: 0.05   // 5% for presentation prep
    };
    
    let currentTime = 0;
    let taskCounter = 0;
    
    // Helper function to assign team members in rotation
    const assignMember = () => {
        return app.teamMembers[taskCounter % teamSize].id;
    };
    
    // Phase 1: Planning & Research
    const planningHours = Math.floor(totalHours * timeAllocation.planning);
    tasks.push({
        title: "Team Kickoff & Brainstorming",
        description: "Initial team meeting to discuss the project idea, establish goals, and align on the vision",
        phase: "planning",
        startDate: addHours(startDate, currentTime),
        endDate: addHours(startDate, currentTime + 1),
        estimatedHours: 1,
        priority: "high",
        assignedTo: assignMember()
    });
    currentTime += 1;
    taskCounter++;
    
    tasks.push({
        title: "Technical Research & Feasibility Study",
        description: "Research technical requirements, APIs, libraries, and tools needed for the project",
        phase: "planning",
        startDate: addHours(startDate, currentTime),
        endDate: addHours(startDate, currentTime + Math.max(1, planningHours - 1)),
        estimatedHours: Math.max(1, planningHours - 1),
        priority: "high",
        assignedTo: assignMember()
    });
    currentTime += Math.max(1, planningHours - 1);
    taskCounter++;
    
    // Phase 2: Design & Architecture
    const designHours = Math.floor(totalHours * timeAllocation.design);
    
    tasks.push({
        title: "System Architecture Design",
        description: "Create high-level system architecture, define components, and plan data flow",
        phase: "design",
        startDate: addHours(startDate, currentTime),
        endDate: addHours(startDate, currentTime + Math.floor(designHours * 0.4)),
        estimatedHours: Math.floor(designHours * 0.4),
        priority: "high",
        assignedTo: assignMember()
    });
    
    tasks.push({
        title: "UI/UX Design & Wireframes",
        description: "Create user interface designs, wireframes, and user flow diagrams",
        phase: "design",
        startDate: addHours(startDate, currentTime),
        endDate: addHours(startDate, currentTime + Math.floor(designHours * 0.6)),
        estimatedHours: Math.floor(designHours * 0.6),
        priority: "high",
        assignedTo: assignMember()
    });
    currentTime += designHours;
    taskCounter += 2;
    
    // Phase 3: Core Development
    const devHours = Math.floor(totalHours * timeAllocation.development);
    
    // Frontend development
    if (isWebApp || isMobile) {
        tasks.push({
            title: "Frontend Setup & Base Structure",
            description: "Set up the frontend framework, create base components, and establish project structure",
            phase: "development",
            startDate: addHours(startDate, currentTime),
            endDate: addHours(startDate, currentTime + Math.floor(devHours * 0.15)),
            estimatedHours: Math.floor(devHours * 0.15),
            priority: "high",
            assignedTo: assignMember()
        });
        taskCounter++;
        
        tasks.push({
            title: "Implement Core UI Components",
            description: "Build the main user interface components and pages",
            phase: "development",
            startDate: addHours(startDate, currentTime + Math.floor(devHours * 0.15)),
            endDate: addHours(startDate, currentTime + Math.floor(devHours * 0.4)),
            estimatedHours: Math.floor(devHours * 0.25),
            priority: "high",
            assignedTo: assignMember()
        });
        taskCounter++;
    }
    
    // Backend development
    if (hasBackend) {
        tasks.push({
            title: "Backend API Development",
            description: "Set up server, create API endpoints, and implement business logic",
            phase: "development",
            startDate: addHours(startDate, currentTime),
            endDate: addHours(startDate, currentTime + Math.floor(devHours * 0.3)),
            estimatedHours: Math.floor(devHours * 0.3),
            priority: "high",
            assignedTo: assignMember()
        });
        taskCounter++;
        
        tasks.push({
            title: "Database Design & Implementation",
            description: "Design database schema, set up database, and create data models",
            phase: "development",
            startDate: addHours(startDate, currentTime),
            endDate: addHours(startDate, currentTime + Math.floor(devHours * 0.2)),
            estimatedHours: Math.floor(devHours * 0.2),
            priority: "high",
            assignedTo: assignMember()
        });
        taskCounter++;
    }
    
    // AI/ML specific tasks
    if (hasAI) {
        tasks.push({
            title: "AI Model Development",
            description: "Develop and train machine learning models for the project",
            phase: "development",
            startDate: addHours(startDate, currentTime + Math.floor(devHours * 0.2)),
            endDate: addHours(startDate, currentTime + Math.floor(devHours * 0.5)),
            estimatedHours: Math.floor(devHours * 0.3),
            priority: "high",
            assignedTo: assignMember()
        });
        taskCounter++;
    }
    
    // Core feature implementation
    tasks.push({
        title: "Implement Core Features",
        description: `Develop the main functionality of the project based on: ${projectIdea.substring(0, 100)}...`,
        phase: "development",
        startDate: addHours(startDate, currentTime + Math.floor(devHours * 0.3)),
        endDate: addHours(startDate, currentTime + Math.floor(devHours * 0.8)),
        estimatedHours: Math.floor(devHours * 0.5),
        priority: "high",
        assignedTo: assignMember()
    });
    currentTime += devHours;
    taskCounter++;
    
    // Phase 4: Integration & Testing
    const integrationHours = Math.floor(totalHours * timeAllocation.integration);
    
    tasks.push({
        title: "System Integration",
        description: "Connect all components, integrate APIs, and ensure smooth data flow",
        phase: "integration",
        startDate: addHours(startDate, currentTime),
        endDate: addHours(startDate, currentTime + integrationHours),
        estimatedHours: integrationHours,
        priority: "medium",
        assignedTo: assignMember()
    });
    currentTime += integrationHours;
    taskCounter++;
    
    // Phase 5: Testing & Bug Fixes
    const testingHours = Math.floor(totalHours * timeAllocation.testing);
    
    tasks.push({
        title: "Testing & Bug Fixes",
        description: "Perform comprehensive testing, identify bugs, and fix critical issues",
        phase: "testing",
        startDate: addHours(startDate, currentTime),
        endDate: addHours(startDate, currentTime + testingHours),
        estimatedHours: testingHours,
        priority: "medium",
        assignedTo: assignMember()
    });
    currentTime += testingHours;
    taskCounter++;
    
    // Phase 6: Presentation Preparation
    const presentationHours = Math.floor(totalHours * timeAllocation.presentation);
    
    tasks.push({
        title: "Create Demo & Presentation",
        description: "Prepare project demo, create presentation slides, and practice pitch",
        phase: "presentation",
        startDate: addHours(startDate, currentTime),
        endDate: addHours(startDate, currentTime + presentationHours),
        estimatedHours: presentationHours,
        priority: "high",
        assignedTo: assignMember()
    });
    taskCounter++;
    
    return tasks;
}

// Helper function to add hours to a date
function addHours(date, hours) {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
}

// Display generated tasks in the UI
function displayGeneratedTasks(tasks) {
    const tasksByPhase = tasks.reduce((acc, task) => {
        if (!acc[task.phase]) acc[task.phase] = [];
        acc[task.phase].push(task);
        return acc;
    }, {});
    
    let html = `
        <div class="space-y-6">
            <h4 class="text-xl font-semibold text-gray-800">✨ AI Generated ${tasks.length} Tasks</h4>
            <p class="text-gray-600">Based on your project idea, I've created a comprehensive task breakdown optimized for your ${app.hackathonSettings.duration}-hour hackathon with ${app.teamMembers.length} team members.</p>
    `;
    
    const phaseNames = {
        planning: '📋 Planning & Research',
        design: '🎨 Design & Architecture',
        development: '💻 Core Development',
        integration: '🔗 Integration',
        testing: '🧪 Testing & QA',
        presentation: '🎤 Presentation Prep'
    };
    
    Object.entries(tasksByPhase).forEach(([phase, phaseTasks]) => {
        html += `
            <div class="border-l-4 border-blue-500 pl-4">
                <h5 class="font-semibold text-lg mb-3">${phaseNames[phase] || phase}</h5>
                <div class="space-y-2">
        `;
        
        phaseTasks.forEach(task => {
            const assignedMember = app.teamMembers.find(m => m.id === task.assignedTo);
            html += `
                <div class="bg-gray-50 p-3 rounded">
                    <div class="flex justify-between items-start">
                        <strong>${task.title}</strong>
                        <span class="team-badge team-member-${assignedMember.colorIndex + 1} text-xs">
                            ${assignedMember.name}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${task.description}</p>
                    <p class="text-xs text-gray-500 mt-2">
                        ${formatDate(task.startDate)} - ${formatDate(task.endDate)}
                        (${task.estimatedHours}h)
                    </p>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
            <div class="mt-6 flex gap-3">
                <button onclick="showPage('calendar')" class="btn btn-primary">
                    View in Calendar
                </button>
                <button onclick="exportTasks()" class="btn btn-secondary">
                    Export Tasks
                </button>
            </div>
        </div>
    `;
    
    elements.aiResponse.innerHTML = html;
}

// Export tasks function
function exportTasks() {
    const exportData = {
        projectIdea: app.projectIdea,
        hackathonSettings: app.hackathonSettings,
        teamMembers: app.teamMembers,
        tasks: app.allTasks
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hackmanager-${app.hackathonSettings.name || 'project'}-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ========== Task Management Functions ==========

// Create a new task
function createTask(taskData) {
    const task = {
        id: generateId(),
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        startDate: taskData.startDate || new Date(),
        endDate: taskData.endDate || new Date(),
        assignedTo: taskData.assignedTo || null,
        status: taskData.status || 'Not Started',
        priority: taskData.priority || 'medium',
        dependencies: taskData.dependencies || [],
        estimatedHours: taskData.estimatedHours || 1,
        phase: taskData.phase || 'development'
    };
    
    app.allTasks.push(task);
    saveToLocalStorage();
    return task;
}

// Update an existing task
function updateTask(taskId, updates) {
    const taskIndex = app.allTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        app.allTasks[taskIndex] = { ...app.allTasks[taskIndex], ...updates };
        saveToLocalStorage();
        
        // Re-render if on calendar page
        if (app.currentPage === 'calendar') {
            renderTasks();
            renderCalendar();
        }
    }
}

// Delete a task
function deleteTask(taskId) {
    app.allTasks = app.allTasks.filter(task => task.id !== taskId);
    
    // Remove dependencies from other tasks
    app.allTasks.forEach(task => {
        task.dependencies = task.dependencies.filter(dep => dep !== taskId);
    });
    
    saveToLocalStorage();
    updateTeamStats();
    
    // Re-render if on calendar page
    if (app.currentPage === 'calendar') {
        renderTasks();
        renderCalendar();
    }
}

// Assign task to team member
function assignTask(taskId, memberId) {
    const task = app.allTasks.find(t => t.id === taskId);
    if (task) {
        task.assignedTo = memberId;
        saveToLocalStorage();
        
        // Re-render if on calendar page
        if (app.currentPage === 'calendar') {
            renderTasks();
        }
    }
}

// Render all tasks
function renderTasks() {
    if (!elements.tasksList) return;
    
    elements.tasksList.innerHTML = '';
    
    if (app.allTasks.length === 0) {
        elements.tasksList.innerHTML = '<p class="text-gray-500">No tasks yet. Generate tasks from your project idea.</p>';
        return;
    }
    
    app.allTasks.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item cursor-pointer hover:shadow-md';
        taskDiv.onclick = () => showTaskModal(task.id);
        
        const assignedMember = app.teamMembers.find(m => m.id === task.assignedTo);
        
        taskDiv.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium">${task.title}</h4>
                ${assignedMember ? `<span class="team-badge team-member-${assignedMember.colorIndex + 1} text-xs">${assignedMember.name}</span>` : ''}
            </div>
            <p class="text-sm text-gray-600">${task.description || 'No description'}</p>
            <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-gray-500">${formatDate(task.startDate)} - ${formatDate(task.endDate)}</span>
                <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">${task.status || 'Not Started'}</span>
            </div>
        `;
        
        elements.tasksList.appendChild(taskDiv);
    });
}

// Filter tasks
function filterTasks(criteria) {
    // Placeholder function
    // Will filter tasks based on criteria
}

// ========== Calendar Functions ==========

// Initialize calendar
function initializeCalendar() {
    // Calculate calendar days based on hackathon settings
    if (!validateHackathonSettings()) {
        return;
    }
    
    const startDate = app.hackathonSettings.startDate;
    const duration = app.hackathonSettings.duration;
    const endDate = calculateEndDate(startDate, duration);
    
    app.calendarData.days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        app.calendarData.days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

// Render calendar
function renderCalendar() {
    if (!elements.calendarContainer) return;
    
    elements.calendarContainer.innerHTML = '';
    
    if (!validateHackathonSettings()) {
        elements.calendarContainer.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p>Please configure hackathon settings first.</p>
                <button onclick="showPage('settings')" class="btn btn-primary mt-4">
                    Go to Settings
                </button>
            </div>
        `;
        return;
    }
    
    // Initialize calendar if needed
    if (app.calendarData.days.length === 0) {
        initializeCalendar();
    }
    
    // Create timeline view
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'space-y-4';
    
    // Add timeline header
    timelineContainer.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Hackathon Timeline</h3>
            <div class="text-sm text-gray-600">
                ${formatFullDate(app.hackathonSettings.startDate)} -
                ${formatFullDate(calculateEndDate(app.hackathonSettings.startDate, app.hackathonSettings.duration))}
            </div>
        </div>
    `;
    
    // Create hourly timeline
    const timeline = document.createElement('div');
    timeline.className = 'bg-gray-50 p-4 rounded-lg overflow-x-auto';
    
    // Group tasks by team member
    const tasksByMember = {};
    app.teamMembers.forEach(member => {
        tasksByMember[member.id] = {
            member: member,
            tasks: app.allTasks.filter(task => task.assignedTo === member.id)
        };
    });
    
    // Render swimlanes for each team member
    Object.values(tasksByMember).forEach(({ member, tasks }) => {
        const swimlane = document.createElement('div');
        swimlane.className = 'mb-4 last:mb-0';
        
        // Member header
        const memberHeader = document.createElement('div');
        memberHeader.className = `team-badge team-member-${member.colorIndex + 1} mb-2`;
        memberHeader.textContent = member.name;
        swimlane.appendChild(memberHeader);
        
        // Task timeline
        const taskTimeline = document.createElement('div');
        taskTimeline.className = 'relative h-16 bg-white rounded border border-gray-200';
        
        // Calculate timeline scale
        const totalHours = app.hackathonSettings.duration;
        const startTime = app.hackathonSettings.startDate.getTime();
        
        // Render tasks as blocks
        tasks.forEach(task => {
            const taskStartOffset = (task.startDate.getTime() - startTime) / (1000 * 60 * 60);
            const taskDuration = (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60);
            
            const leftPercent = (taskStartOffset / totalHours) * 100;
            const widthPercent = (taskDuration / totalHours) * 100;
            
            const taskBlock = document.createElement('div');
            taskBlock.className = `absolute top-2 bottom-2 bg-opacity-80 rounded cursor-pointer hover:shadow-lg transition-shadow team-member-${member.colorIndex + 1}`;
            taskBlock.style.left = `${leftPercent}%`;
            taskBlock.style.width = `${widthPercent}%`;
            taskBlock.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(`--team-color-${member.colorIndex + 1}`);
            
            // Add task info
            taskBlock.innerHTML = `
                <div class="px-2 py-1 text-xs text-white truncate">
                    ${task.title}
                </div>
            `;
            
            taskBlock.onclick = () => showTaskModal(task.id);
            taskBlock.title = `${task.title} (${task.estimatedHours}h)`;
            
            taskTimeline.appendChild(taskBlock);
        });
        
        swimlane.appendChild(taskTimeline);
        timeline.appendChild(swimlane);
    });
    
    // Add hour markers
    const hourMarkers = document.createElement('div');
    hourMarkers.className = 'flex justify-between text-xs text-gray-500 mt-2 px-1';
    
    const markerCount = Math.min(app.hackathonSettings.duration, 8);
    const hourInterval = Math.floor(app.hackathonSettings.duration / markerCount);
    
    for (let i = 0; i <= markerCount; i++) {
        const hour = i * hourInterval;
        const marker = document.createElement('span');
        marker.textContent = `${hour}h`;
        hourMarkers.appendChild(marker);
    }
    
    timeline.appendChild(hourMarkers);
    timelineContainer.appendChild(timeline);
    
    // Add legend
    const legend = document.createElement('div');
    legend.className = 'mt-4 text-xs text-gray-600';
    legend.innerHTML = `
        <p>💡 Click on any task block to view details or edit</p>
        <p>📊 Tasks are automatically distributed among team members</p>
    `;
    timelineContainer.appendChild(legend);
    
    elements.calendarContainer.appendChild(timelineContainer);
}

// Format full date
function formatFullDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Update calendar view
function updateCalendarView(view) {
    // Placeholder function
    // Will switch between week/month views
}

// Add task to calendar
function addTaskToCalendar(task) {
    // Placeholder function
    // Will add a task to the calendar display
}

// Handle calendar day click
function handleCalendarDayClick(date) {
    // Pre-fill the task modal with the clicked date
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0); // Default to 9 AM
    
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0); // Default 1 hour duration
    
    // Show modal for new task
    showTaskModal(null);
    
    // Pre-fill dates
    setTimeout(() => {
        document.getElementById('task-start').value = formatDateTimeLocal(startDate);
        document.getElementById('task-end').value = formatDateTimeLocal(endDate);
    }, 100);
}

// ========== Modal Functions ==========

// Show task modal
function showTaskModal(taskId = null) {
    const modal = elements.taskModal;
    const isEditing = taskId !== null;
    const task = isEditing ? app.allTasks.find(t => t.id === taskId) : null;
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold">${isEditing ? 'Edit Task' : 'Create New Task'}</h3>
                <button onclick="hideTaskModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <form id="task-form" class="space-y-4">
                <div>
                    <label class="form-label">Task Title</label>
                    <input type="text" id="task-title" class="form-input"
                           value="${task ? task.title : ''}" required>
                </div>
                
                <div>
                    <label class="form-label">Description</label>
                    <textarea id="task-description" class="form-input h-24"
                              placeholder="Describe the task...">${task ? task.description : ''}</textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Assigned To</label>
                        <select id="task-assignee" class="form-input">
                            <option value="">Unassigned</option>
                            ${app.teamMembers.map(member => `
                                <option value="${member.id}" ${task && task.assignedTo === member.id ? 'selected' : ''}>
                                    ${member.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="form-label">Priority</label>
                        <select id="task-priority" class="form-input">
                            <option value="low" ${task && task.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${task && task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${task && task.priority === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Start Time</label>
                        <input type="datetime-local" id="task-start" class="form-input"
                               value="${task ? formatDateTimeLocal(task.startDate) : ''}" required>
                    </div>
                    
                    <div>
                        <label class="form-label">End Time</label>
                        <input type="datetime-local" id="task-end" class="form-input"
                               value="${task ? formatDateTimeLocal(task.endDate) : ''}" required>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">Status</label>
                    <select id="task-status" class="form-input">
                        <option value="Not Started" ${task && task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                        <option value="In Progress" ${task && task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${task && task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Blocked" ${task && task.status === 'Blocked' ? 'selected' : ''}>Blocked</option>
                    </select>
                </div>
                
                <div class="flex justify-between pt-4">
                    <div>
                        ${isEditing ? `
                            <button type="button" onclick="deleteTask('${taskId}'); hideTaskModal();"
                                    class="text-red-600 hover:text-red-800">
                                Delete Task
                            </button>
                        ` : ''}
                    </div>
                    <div class="space-x-3">
                        <button type="button" onclick="hideTaskModal()"
                                class="px-4 py-2 text-gray-600 hover:text-gray-800">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${isEditing ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Add form submit handler
    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignedTo: document.getElementById('task-assignee').value || null,
            priority: document.getElementById('task-priority').value,
            startDate: new Date(document.getElementById('task-start').value),
            endDate: new Date(document.getElementById('task-end').value),
            status: document.getElementById('task-status').value
        };
        
        if (isEditing) {
            updateTask(taskId, formData);
        } else {
            createTask(formData);
        }
        
        hideTaskModal();
        
        // Refresh views
        if (app.currentPage === 'calendar') {
            renderCalendar();
            renderTasks();
        }
        updateTeamStats();
    });
}

// Hide task modal
function hideTaskModal() {
    elements.taskModal.classList.add('hidden');
}

// Format date for datetime-local input
function formatDateTimeLocal(date) {
    if (!date) return '';
    const d = new Date(date);
    const localDateTime = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDateTime.toISOString().slice(0, 16);
}

// ========== Utility Functions ==========

// Generate unique ID
function generateId() {
    // Placeholder function
    // Will generate unique IDs for tasks and team members
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date
function formatDate(date) {
    // Placeholder function
    // Will format dates for display
}

// Parse duration
function parseDuration(duration) {
    // Placeholder function
    // Will parse duration strings
}

// Calculate end date
function calculateEndDate(startDate, duration) {
    // Placeholder function
    // Will calculate hackathon end date
}

// Get team member color
function getTeamMemberColor(memberIndex) {
    // Placeholder function
    // Will return the CSS class for team member color
    return `team-member-${(memberIndex % 8) + 1}`;
}

// ========== Local Storage Functions ==========

// Save to local storage
function saveToLocalStorage() {
    const dataToSave = {
        hackathonSettings: app.hackathonSettings,
        teamMembers: app.teamMembers,
        allTasks: app.allTasks,
        projectIdea: app.projectIdea
    };
    
    localStorage.setItem('hackmanagerData', JSON.stringify(dataToSave));
}

// Load from local storage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('hackmanagerData');
    
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            
            if (parsed.hackathonSettings) {
                app.hackathonSettings = parsed.hackathonSettings;
                // Convert date strings back to Date objects
                if (app.hackathonSettings.startDate) {
                    app.hackathonSettings.startDate = new Date(app.hackathonSettings.startDate);
                }
            }
            
            if (parsed.teamMembers) {
                app.teamMembers = parsed.teamMembers;
            }
            
            if (parsed.allTasks) {
                app.allTasks = parsed.allTasks;
                // Convert date strings back to Date objects
                app.allTasks.forEach(task => {
                    if (task.startDate) task.startDate = new Date(task.startDate);
                    if (task.endDate) task.endDate = new Date(task.endDate);
                });
            }
            
            if (parsed.projectIdea) {
                app.projectIdea = parsed.projectIdea;
            }
            
            // Update UI with loaded data
            if (elements.hackathonName) elements.hackathonName.value = app.hackathonSettings.name || '';
            if (elements.startDate && app.hackathonSettings.startDate) {
                const localDateTime = new Date(app.hackathonSettings.startDate.getTime() - app.hackathonSettings.startDate.getTimezoneOffset() * 60000);
                elements.startDate.value = localDateTime.toISOString().slice(0, 16);
            }
            if (elements.duration) elements.duration.value = app.hackathonSettings.duration || '';
            if (elements.projectIdeaInput) elements.projectIdeaInput.value = app.projectIdea || '';
            
        } catch (error) {
            console.error('Error loading data from local storage:', error);
        }
    }
}

// Clear local storage
function clearLocalStorage() {
    // Placeholder function
    // Will clear all saved data
}

// ========== Export/Import Functions ==========

// Export data
function exportData() {
    // Placeholder function
    // Will export project data as JSON
}

// Import data
function importData(jsonData) {
    // Placeholder function
    // Will import project data from JSON
}