// HackManager - Main JavaScript File
//would hackatime work properly now? wakatime must be my saviour 
//gottaworknowwakawakwakakaks so, you gotta work now man why will you not.

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
    //wakatimeshoudlreworknow.
    // Calendar data structure
    calendarData: {
        days: [],
        currentView: 'week' // 'week' or 'month'
    }
};
//waakatime please start working again my frien
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
    elements.teamMembersList = document.getElementById('team-members-simple-list');
    elements.memberDetails = document.getElementById('member-details');
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
    
    // AI Mode Selection
    const aiModeRadios = document.querySelectorAll('input[name="ai-mode"]');
    const apiKeySection = document.getElementById('api-key-section');
    const apiKeyInput = document.getElementById('openai-api-key');
    
    aiModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'openai') {
                apiKeySection.classList.remove('hidden');
                // Load saved API key if exists
                const savedKey = localStorage.getItem('openai_api_key');
                if (savedKey) {
                    apiKeyInput.value = savedKey;
                }
            } else {
                apiKeySection.classList.add('hidden');
            }
        });
    });
    
    // Save API key when changed
    if (apiKeyInput) {
        apiKeyInput.addEventListener('change', (e) => {
            if (e.target.value) {
                localStorage.setItem('openai_api_key', e.target.value);
            }
        });
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
        colorIndex: app.teamMembers.length % 8,
        skills: [],
        sleepStart: '02:00', // Default sleep start (2 AM)
        sleepEnd: '08:00'    // Default sleep end (8 AM)
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
    
    // Simple list
    app.teamMembers.forEach((member, index) => {
        const memberDiv = document.createElement('div');
        memberDiv.className = `p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${app.selectedMemberId === member.id ? 'bg-blue-50' : ''}`;
        memberDiv.onclick = () => selectTeamMember(member.id);
        memberDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="team-badge team-member-${member.colorIndex + 1}">${member.name}</span>
                <button onclick="event.stopPropagation(); removeTeamMember('${member.id}')" class="text-red-500 hover:text-red-700 opacity-0 hover:opacity-100 transition-opacity">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        elements.teamMembersList.appendChild(memberDiv);
    });
}

// Select team member for editing
function selectTeamMember(memberId) {
    app.selectedMemberId = memberId;
    renderTeamMembers();
    renderMemberDetails(memberId);
}

// Render member details
function renderMemberDetails(memberId) {
    const member = app.teamMembers.find(m => m.id === memberId);
    if (!member || !elements.memberDetails) return;
    
    elements.memberDetails.innerHTML = `
        <div class="space-y-4">
            <div>
                <h4 class="font-semibold text-lg mb-2 flex items-center">
                    <span class="team-badge team-member-${member.colorIndex + 1}">${member.name}</span>
                </h4>
            </div>
            
            <!-- Skills Section -->
            <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">Skills</label>
                <div class="flex flex-wrap gap-2 mb-2">
                    ${member.skills.map(skill => `
                        <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center">
                            ${skill}
                            <button onclick="removeSkill('${member.id}', '${skill}')" class="ml-1 text-blue-500 hover:text-blue-700">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </span>
                    `).join('')}
                </div>
                <div class="flex gap-2">
                    <input type="text"
                           id="skill-input-${member.id}"
                           placeholder="Type a skill (e.g., React, Python, Design)"
                           class="flex-1 text-sm border-gray-300 rounded px-3 py-2"
                           onkeypress="if(event.key === 'Enter') { addCustomSkill('${member.id}'); }">
                    <button onclick="addCustomSkill('${member.id}')" class="btn btn-secondary text-sm py-2">
                        Add
                    </button>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    Suggestions: JavaScript, Python, React, Vue, Angular, Node.js, Django, Flutter,
                    Swift, Kotlin, UI Design, UX Research, Data Science, Machine Learning,
                    Cloud Computing, Docker, Kubernetes, GraphQL, REST APIs, MongoDB, PostgreSQL
                </div>
            </div>
            
            <!-- Sleep Schedule -->
            <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">Sleep Schedule</label>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-gray-600 mb-1 block">Sleep Start</label>
                        <input type="time"
                               value="${member.sleepStart}"
                               onchange="updateSleepSchedule('${member.id}', 'sleepStart', this.value)"
                               class="text-sm border-gray-300 rounded w-full px-3 py-2">
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 mb-1 block">Sleep End</label>
                        <input type="time"
                               value="${member.sleepEnd}"
                               onchange="updateSleepSchedule('${member.id}', 'sleepEnd', this.value)"
                               class="text-sm border-gray-300 rounded w-full px-3 py-2">
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                    Tasks won't be scheduled during sleep hours
                </p>
            </div>
            
            <!-- Statistics -->
            <div class="pt-4 border-t">
                <h5 class="text-sm font-medium text-gray-700 mb-2">Member Statistics</h5>
                <div class="text-sm text-gray-600 space-y-1">
                    <p>Assigned Tasks: ${app.allTasks.filter(t => t.assignedTo === member.id).length}</p>
                    <p>Total Hours: ${app.allTasks.filter(t => t.assignedTo === member.id).reduce((sum, t) => sum + t.estimatedHours, 0)}h</p>
                </div>
            </div>
        </div>
    `;
}

// Add custom skill
function addCustomSkill(memberId) {
    const input = document.getElementById(`skill-input-${memberId}`);
    const skill = input.value.trim();
    
    if (!skill) return;
    
    const member = app.teamMembers.find(m => m.id === memberId);
    if (member && !member.skills.includes(skill)) {
        member.skills.push(skill);
        saveToLocalStorage();
        renderMemberDetails(memberId);
        input.value = '';
    }
}

// Add skill to team member
function addSkill(memberId, skill) {
    if (!skill) return;
    
    const member = app.teamMembers.find(m => m.id === memberId);
    if (member && !member.skills.includes(skill)) {
        member.skills.push(skill);
        saveToLocalStorage();
        renderTeamMembers();
    }
}

// Remove skill from team member
function removeSkill(memberId, skill) {
    const member = app.teamMembers.find(m => m.id === memberId);
    if (member) {
        member.skills = member.skills.filter(s => s !== skill);
        saveToLocalStorage();
        if (app.selectedMemberId === memberId) {
            renderMemberDetails(memberId);
        }
    }
}

// Update sleep schedule
function updateSleepSchedule(memberId, field, value) {
    const member = app.teamMembers.find(m => m.id === memberId);
    if (member) {
        member[field] = value;
        saveToLocalStorage();
    }
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
async function generateTasksFromIdea() {
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
    
    // Check which AI mode is selected
    const selectedMode = document.querySelector('input[name="ai-mode"]:checked').value;
    
    if (selectedMode === 'openai') {
        const apiKey = document.getElementById('openai-api-key').value;
        if (!apiKey) {
            alert('Please enter your OpenAI API key.');
            return;
        }
    }
    
    // Save the project idea
    saveProjectIdea(idea);
    
    // Show loading state
    elements.aiResponse.innerHTML = '<p class="text-gray-600">🤖 AI is analyzing your project idea and generating a comprehensive task breakdown...</p>';
    elements.aiResponse.classList.remove('hidden');
    
    try {
        let generatedTasks;
        
        if (selectedMode === 'openai') {
            // Use OpenAI API
            generatedTasks = await generateTasksWithOpenAI(idea);
        } else {
            // Use local generation (with simulated delay)
            await new Promise(resolve => setTimeout(resolve, 1500));
            generatedTasks = generateProjectTasks(idea);
        }
        
        // Clear existing tasks
        app.allTasks = [];
        
        // Add all tasks to the app
        generatedTasks.forEach(task => createTask(task));
        
        // Display results
        displayGeneratedTasks(generatedTasks);
        
        // Update team stats
        updateTeamStats();
        
    } catch (error) {
        console.error('Error generating tasks:', error);
        elements.aiResponse.innerHTML = `
            <div class="text-red-600">
                <p class="font-semibold">Error generating tasks</p>
                <p class="text-sm mt-1">${error.message}</p>
                <button onclick="generateTasksFromIdea()" class="btn btn-primary mt-3">Try Again</button>
            </div>
        `;
    }
}

// Generate tasks using OpenAI API
async function generateTasksWithOpenAI(projectIdea) {
    const apiKey = document.getElementById('openai-api-key').value;
    const startDate = new Date(app.hackathonSettings.startDate);
    const totalHours = app.hackathonSettings.duration;
    const teamMembers = app.teamMembers;
    
    const prompt = `You are a hackathon project manager. Generate a detailed task breakdown for a ${totalHours}-hour hackathon project.

Project Idea: ${projectIdea}

Team Members with Skills and Sleep Schedules:
${teamMembers.map(m => `- ${m.name}: Skills: [${m.skills.join(', ') || 'No specific skills listed'}], Sleep: ${m.sleepStart}-${m.sleepEnd}`).join('\n')}

Start Date: ${startDate.toISOString()}
Duration: ${totalHours} hours

IMPORTANT CONSTRAINTS:
1. Assign tasks based on team members' skills when possible
2. NEVER schedule tasks during a team member's sleep hours
3. Use 24-hour time format for all times

Generate a comprehensive list of tasks in JSON format. Each task should have:
- title: Clear, action-oriented task name
- description: Detailed description of what needs to be done
- phase: One of "planning", "design", "development", "integration", "testing", "presentation"
- estimatedHours: Realistic time estimate (consider sleep schedules)
- priority: "high", "medium", or "low"
- assignedTo: Assign to the team member with the most relevant skills for the task

Skill mapping guide:
- Frontend tasks → members with Frontend, UI/UX skills
- Backend tasks → members with Backend, Database skills
- Mobile tasks → members with Mobile skills
- AI/ML tasks → members with AI/ML skills
- Testing tasks → members with Testing skills
- Planning tasks → members with Project Management skills

Allocate time wisely:
- Planning: ~10% (research, brainstorming)
- Design: ~15% (architecture, UI/UX)
- Development: ~50% (core features)
- Integration: ~10% (connecting components)
- Testing: ~10% (QA, bug fixes)
- Presentation: ~5% (demo prep)

Consider the project type and include relevant tasks like API development, database design, AI/ML implementation, etc.

Return ONLY a JSON array of task objects.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful hackathon project manager that generates detailed task breakdowns. Always respond with valid JSON arrays only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Parse the AI response
        let tasks;
        try {
            // Extract JSON from the response (in case there's extra text)
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                tasks = JSON.parse(jsonMatch[0]);
            } else {
                tasks = JSON.parse(aiResponse);
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponse);
            throw new Error('Failed to parse AI response. Using local generation as fallback.');
        }
        
        // Process and validate tasks
        const processedTasks = tasks.map((task, index) => {
            // Find team member by name
            const assignedMember = teamMembers.find(m => m.name === task.assignedTo) || teamMembers[index % teamMembers.length];
            
            // Calculate dates based on estimated hours
            const taskStart = addHours(startDate,
                tasks.slice(0, index).reduce((sum, t) => sum + (t.estimatedHours || 1), 0)
            );
            const taskEnd = addHours(taskStart, task.estimatedHours || 1);
            
            return {
                title: task.title || 'Untitled Task',
                description: task.description || '',
                phase: task.phase || 'development',
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: task.estimatedHours || 1,
                priority: task.priority || 'medium',
                assignedTo: assignedMember.id,
                status: 'Not Started'
            };
        });
        
        return processedTasks;
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        // Fallback to local generation
        console.log('Falling back to local task generation');
        return generateProjectTasks(projectIdea);
    }
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
    
    // Helper function to assign team members based on skills and availability
    const assignMember = (taskPhase, taskTitle) => {
        // Map phases to relevant skills
        const phaseSkillMap = {
            'planning': ['Project Management', 'Other'],
            'design': ['UI/UX', 'Frontend', 'Mobile'],
            'development': ['Frontend', 'Backend', 'Mobile', 'Database', 'AI/ML'],
            'integration': ['Backend', 'DevOps', 'Database'],
            'testing': ['Testing', 'DevOps'],
            'presentation': ['Project Management', 'UI/UX']
        };
        
        // Get relevant skills for this phase
        const relevantSkills = phaseSkillMap[taskPhase] || [];
        
        // Find team members with matching skills
        let eligibleMembers = app.teamMembers.filter(member =>
            member.skills.some(skill => relevantSkills.includes(skill))
        );
        
        // If no members with matching skills, use all members
        if (eligibleMembers.length === 0) {
            eligibleMembers = app.teamMembers;
        }
        
        // Rotate among eligible members
        const selectedMember = eligibleMembers[taskCounter % eligibleMembers.length];
        return selectedMember.id;
    };
    
    // Helper function to check if time falls within sleep schedule
    const isDuringSleep = (date, member) => {
        const hours = date.getHours();
        const sleepStartHour = parseInt(member.sleepStart.split(':')[0]);
        const sleepEndHour = parseInt(member.sleepEnd.split(':')[0]);
        
        if (sleepStartHour < sleepEndHour) {
            // Normal sleep schedule (e.g., 23:00 to 07:00)
            return hours >= sleepStartHour || hours < sleepEndHour;
        } else {
            // Sleep schedule crosses midnight (e.g., 02:00 to 08:00)
            return hours >= sleepStartHour && hours < sleepEndHour;
        }
    };
    
    // Helper function to get next available time considering sleep
    const getNextAvailableTime = (proposedTime, assignedMemberId) => {
        const member = app.teamMembers.find(m => m.id === assignedMemberId);
        if (!member) return proposedTime;
        
        let adjustedTime = new Date(proposedTime);
        
        // Check if proposed time is during sleep
        while (isDuringSleep(adjustedTime, member)) {
            adjustedTime.setHours(adjustedTime.getHours() + 1);
        }
        
        return adjustedTime;
    };
    
    // Phase 1: Planning & Research
    const planningHours = Math.floor(totalHours * timeAllocation.planning);
    let task1Member = assignMember("planning", "Team Kickoff & Brainstorming");
    let task1Start = getNextAvailableTime(addHours(startDate, currentTime), task1Member);
    let task1End = addHours(task1Start, 1);
    
    tasks.push({
        title: "Team Kickoff & Brainstorming",
        description: "Initial team meeting to discuss the project idea, establish goals, and align on the vision",
        phase: "planning",
        startDate: task1Start,
        endDate: task1End,
        estimatedHours: 1,
        priority: "high",
        assignedTo: task1Member
    });
    currentTime += 1;
    taskCounter++;
    
    let task2Member = assignMember("planning", "Technical Research & Feasibility Study");
    let task2Start = getNextAvailableTime(addHours(startDate, currentTime), task2Member);
    let task2Hours = Math.max(1, planningHours - 1);
    let task2End = addHours(task2Start, task2Hours);
    
    tasks.push({
        title: "Technical Research & Feasibility Study",
        description: "Research technical requirements, APIs, libraries, and tools needed for the project",
        phase: "planning",
        startDate: task2Start,
        endDate: task2End,
        estimatedHours: task2Hours,
        priority: "high",
        assignedTo: task2Member
    });
    currentTime += task2Hours;
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
    if (!validateHackathonSettings()) {
        document.getElementById('calendar-container').innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p>Please configure hackathon settings first.</p>
                <button onclick="showPage('settings')" class="btn btn-primary mt-4">
                    Go to Settings
                </button>
            </div>
        `;
        return;
    }
    
    // Update date range display
    const dateRange = document.getElementById('calendar-date-range');
    if (dateRange) {
        dateRange.textContent = `${formatFullDate(app.hackathonSettings.startDate)} - ${formatFullDate(calculateEndDate(app.hackathonSettings.startDate, app.hackathonSettings.duration))}`;
    }
    
    // Render time column
    renderTimeColumn();
    
    // Render calendar grid
    renderCalendarGrid();
    
    // Render team members sidebar
    renderTeamMembersSidebar();
}

// Render time column
function renderTimeColumn() {
    const timeColumn = document.getElementById('time-column');
    if (!timeColumn) return;
    
    timeColumn.innerHTML = '';
    
    // Calculate total hours and create time slots
    const startDate = new Date(app.hackathonSettings.startDate);
    const totalHours = app.hackathonSettings.duration;
    
    for (let i = 0; i <= totalHours; i++) {
        const currentHour = new Date(startDate);
        currentHour.setHours(currentHour.getHours() + i);
        
        const timeSlot = document.createElement('div');
        timeSlot.className = 'h-20 border-b border-gray-200 text-xs text-gray-500 px-2 py-1';
        timeSlot.textContent = currentHour.getHours().toString().padStart(2, '0') + ':00';
        
        timeColumn.appendChild(timeSlot);
    }
}

// Render calendar grid
function renderCalendarGrid() {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create header with day columns
    const header = document.createElement('div');
    header.className = 'flex h-12 border-b border-gray-200 bg-gray-50';
    
    // Calculate days in hackathon
    const startDate = new Date(app.hackathonSettings.startDate);
    const endDate = calculateEndDate(startDate, app.hackathonSettings.duration);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Create day headers
    for (let d = 0; d < days; d++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + d);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'flex-1 text-center text-sm font-medium text-gray-700 py-3 border-r border-gray-200 last:border-r-0';
        dayHeader.textContent = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        header.appendChild(dayHeader);
    }
    container.appendChild(header);
    
    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'relative';
    grid.style.height = `${app.hackathonSettings.duration * 80}px`; // 80px per hour
    
    // Create hour grid lines
    for (let h = 0; h <= app.hackathonSettings.duration; h++) {
        const hourLine = document.createElement('div');
        hourLine.className = 'absolute w-full border-b border-gray-200';
        hourLine.style.top = `${h * 80}px`;
        grid.appendChild(hourLine);
    }
    
    // Create day columns
    const dayColumns = document.createElement('div');
    dayColumns.className = 'absolute inset-0 flex';
    
    for (let d = 0; d < days; d++) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'flex-1 border-r border-gray-200 last:border-r-0';
        dayColumns.appendChild(dayColumn);
    }
    grid.appendChild(dayColumns);
    
    // Render tasks
    app.allTasks.forEach(task => {
        const taskElement = createTaskElement(task, startDate, days);
        if (taskElement) {
            grid.appendChild(taskElement);
        }
    });
    
    container.appendChild(grid);
}

// Create task element for calendar
function createTaskElement(task, calendarStart, totalDays) {
    const member = app.teamMembers.find(m => m.id === task.assignedTo);
    if (!member) return null;
    
    // Calculate position
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // Calculate which day column
    const dayOffset = Math.floor((taskStart - calendarStart) / (1000 * 60 * 60 * 24));
    if (dayOffset < 0 || dayOffset >= totalDays) return null;
    
    // Calculate vertical position (minutes from start of hackathon)
    const minutesFromStart = (taskStart - calendarStart) / (1000 * 60);
    const topPosition = (minutesFromStart / 60) * 80; // 80px per hour
    
    // Calculate height
    const durationMinutes = (taskEnd - taskStart) / (1000 * 60);
    const height = (durationMinutes / 60) * 80;
    
    // Calculate horizontal position
    const dayWidth = 100 / totalDays;
    const left = dayOffset * dayWidth;
    
    const taskEl = document.createElement('div');
    taskEl.className = `absolute rounded px-2 py-1 cursor-pointer hover:shadow-lg transition-shadow text-white text-xs overflow-hidden`;
    taskEl.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(`--team-color-${member.colorIndex + 1}`);
    taskEl.style.top = `${topPosition}px`;
    taskEl.style.height = `${height - 4}px`; // -4 for padding
    taskEl.style.left = `${left + 0.5}%`; // 0.5% margin
    taskEl.style.width = `${dayWidth - 1}%`; // -1% for margins
    taskEl.style.zIndex = '10';
    
    taskEl.innerHTML = `
        <div class="font-semibold truncate">${formatDate(taskStart)} - ${formatDate(taskEnd)}</div>
        <div class="truncate">${task.title}</div>
        <div class="text-xs opacity-75">${member.name}</div>
    `;
    
    taskEl.onclick = () => showTaskModal(task.id);
    taskEl.title = `${task.title}\n${member.name}\n${formatDate(taskStart)} - ${formatDate(taskEnd)}`;
    
    return taskEl;
}

// Render team members sidebar
function renderTeamMembersSidebar() {
    const membersList = document.getElementById('team-members-calendar-list');
    if (!membersList) return;
    
    membersList.innerHTML = '';
    
    app.teamMembers.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors';
        memberItem.onclick = () => showMemberTasks(member.id);
        
        const taskCount = app.allTasks.filter(t => t.assignedTo === member.id).length;
        const totalHours = app.allTasks.filter(t => t.assignedTo === member.id)
            .reduce((sum, t) => sum + t.estimatedHours, 0);
        
        memberItem.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="team-badge team-member-${member.colorIndex + 1} text-sm">${member.name}</span>
                <span class="text-xs text-gray-500">${taskCount} tasks</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">${totalHours}h total</div>
        `;
        
        membersList.appendChild(memberItem);
    });
}

// Show member tasks popup
function showMemberTasks(memberId) {
    const member = app.teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    const popup = document.getElementById('member-tasks-popup');
    const popupName = document.getElementById('popup-member-name');
    const popupTasks = document.getElementById('popup-member-tasks');
    
    if (!popup || !popupName || !popupTasks) return;
    
    // Update popup content
    popupName.textContent = member.name;
    popupName.className = `font-semibold mb-2 team-member-${member.colorIndex + 1} text-white px-2 py-1 rounded inline-block`;
    
    const memberTasks = app.allTasks.filter(t => t.assignedTo === memberId);
    
    popupTasks.innerHTML = memberTasks.length > 0 ? memberTasks.map(task => `
        <div class="p-2 bg-white rounded border border-gray-200 cursor-pointer hover:shadow-sm"
             onclick="showTaskModal('${task.id}')">
            <div class="font-medium">${task.title}</div>
            <div class="text-xs text-gray-500">
                ${formatDate(task.startDate)} - ${formatDate(task.endDate)}
                (${task.estimatedHours}h)
            </div>
            <div class="text-xs text-gray-600 mt-1">${task.phase}</div>
        </div>
    `).join('') : '<p class="text-gray-500">No tasks assigned yet</p>';
    
    // Show popup
    popup.classList.remove('hidden');
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
    if (!date) return '';
    const d = new Date(date);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${hours}:${minutes}`;
}

// Parse duration
function parseDuration(duration) {
    // Placeholder function
    // Will parse duration strings
}

// Calculate end date
function calculateEndDate(startDate, durationHours) {
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + durationHours);
    return endDate;
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
    if (confirm('Are you sure you want to clear all data and reset the application? This action cannot be undone.')) {
        // Clear all stored data
        localStorage.removeItem('hackmanagerData');
        localStorage.removeItem('openai_api_key');
        
        // Reset application state
        app.currentPage = 'ai-assistant';
        app.hackathonSettings = {
            name: '',
            startDate: null,
            duration: null
        };
        app.teamMembers = [];
        app.allTasks = [];
        app.calendarData = {
            days: [],
            currentView: 'week'
        };
        app.projectIdea = '';
        app.selectedMemberId = null;
        
        // Clear form inputs
        if (elements.hackathonName) elements.hackathonName.value = '';
        if (elements.startDate) elements.startDate.value = '';
        if (elements.duration) elements.duration.value = '48';
        if (elements.projectIdeaInput) elements.projectIdeaInput.value = '';
        
        // Clear API key input
        const apiKeyInput = document.getElementById('openai-api-key');
        if (apiKeyInput) apiKeyInput.value = '';
        
        // Reset radio buttons
        const localAIRadio = document.querySelector('input[name="ai-mode"][value="local"]');
        if (localAIRadio) localAIRadio.checked = true;
        
        // Hide API key section
        const apiKeySection = document.getElementById('api-key-section');
        if (apiKeySection) apiKeySection.classList.add('hidden');
        
        // Clear AI response
        if (elements.aiResponse) {
            elements.aiResponse.innerHTML = '';
            elements.aiResponse.classList.add('hidden');
        }
        
        // Update UI
        renderTeamMembers();
        updateTeamStats();
        
        // Show success message and redirect to settings
        alert('All data has been cleared successfully. The application has been reset.');
        showPage('settings');
    }
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