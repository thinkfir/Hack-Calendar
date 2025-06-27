// Global application state
const app = {
    currentPage: 'dashboard', // Default to dashboard for the main app
    hackathonSettings: {
        name: '',
        startDate: null,
        duration: null // in hours
    },
    teamMembers: [],
    allTasks: [], // All tasks generated and managed by the app
    calendarData: {
        days: [],
        currentView: 'week'
    },
    projectIdea: '', // Project idea from onboarding or settings
    selectedMemberId: null, // For tracking which team member is selected in the team page
    chatHistory: {
        general: [] // Chat history for post-onboarding AI interaction
    }
};

// Element references (cached for performance)
const elements = {};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Cache common DOM elements
    elements.pages = document.querySelectorAll('.page');
    elements.navLinks = document.querySelectorAll('.nav-link');
    
    // Main App elements
    elements.mainSidebar = document.getElementById('main-sidebar');
    elements.sidebarToggle = document.getElementById('sidebar-toggle');
    elements.sidebarOverlay = document.getElementById('sidebar-overlay');
    
    elements.dashboardContent = document.getElementById('dashboard-content');
    elements.generalChatInput = document.getElementById('general-chat-input');
    elements.generalChatForm = document.getElementById('general-chat-form');
    
    // Settings page elements
    elements.hackathonName = document.getElementById('hackathon-name');
    elements.startDate = document.getElementById('start-date');
    elements.duration = document.getElementById('duration');
    elements.settingsForm = document.getElementById('settings-form');
    elements.exportDataBtn = document.getElementById('export-data-btn');
    elements.importDataInput = document.getElementById('import-data-input');
    elements.clearDataBtn = document.getElementById('clear-data-btn');
    elements.aiProviderSelect = document.getElementById('ai-provider');
    elements.aiModelSelect = document.getElementById('ai-model');
    elements.apiKeyInput = document.getElementById('api-key');
    elements.apiEndpointInput = document.getElementById('api-endpoint');
    elements.aiModelLabel = document.getElementById('ai-model-label');

    // Team page elements
    elements.teamMembersSimpleList = document.getElementById('team-members-simple-list');
    elements.addMemberBtn = document.getElementById('add-member-btn');
    elements.memberDetails = document.getElementById('member-details');
    elements.teamStats = document.getElementById('team-stats');

    // Calendar page elements
    elements.calendarContainer = document.getElementById('calendar-container');
    elements.calendarDateRange = document.getElementById('calendar-date-range');
    elements.timeColumn = document.getElementById('time-column');
    elements.calendarDaysHeader = document.getElementById('calendar-days-header');
    elements.calendarScrollContainer = document.getElementById('calendar-scroll-container');
    elements.calendarScrollbar = document.getElementById('calendar-scrollbar');
    elements.scrollbarContent = document.getElementById('scrollbar-content');
    elements.teamMembersCalendarList = document.getElementById('team-members-calendar-list');
    
    // Modals
    elements.taskModal = document.getElementById('task-modal');
    elements.customMessageModal = document.getElementById('custom-message-modal');
    elements.customMessageTitle = document.getElementById('custom-message-title');
    elements.customMessageBody = document.getElementById('custom-message-body');
    elements.customMessageConfirmBtn = document.getElementById('custom-message-confirm-btn');
    elements.customMessageCancelBtn = document.getElementById('custom-message-cancel-btn');
    elements.customMessageOkBtn = document.getElementById('custom-message-ok-btn');
    elements.memberTasksPopup = document.getElementById('member-tasks-popup');
    
    loadFromLocalStorage(); // Load saved data from onboarding
    setupEventListeners(); // Attach all event listeners
    initializeUI(); // Set up initial UI state for dashboard elements

    // After loading, decide where to go
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    // If onboarding is not completed or critical data is missing, redirect to the first onboarding page
    if (!hasSeenOnboarding || app.hackathonSettings.name === '' || !app.hackathonSettings.startDate || !app.hackathonSettings.duration || app.teamMembers.length === 0 || app.projectIdea === '') {
        window.location.href = 'index.html'; // Redirect to the first onboarding page
    } else {
        showPage('dashboard'); // If onboarding completed, show the dashboard
    }
});

// ========== UI & Navigation Functions ==========

/**
 * Shows a specific page in the application.
 * Hides all other pages and activates the corresponding navigation link.
 * @param {string} pageId - The ID of the page to show (e.g., 'dashboard', 'calendar').
 */
function showPage(pageId) {
    app.currentPage = pageId;

    // Hide all main app pages
    elements.pages.forEach(page => {
        page.classList.add('hidden');
    });

    // Deactivate all nav links
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show the selected main app page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Activate corresponding nav link
    const activeNavLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }

    // Hide mobile sidebar and overlay if active
    elements.mainSidebar.classList.add('-translate-x-full');
    elements.sidebarOverlay.classList.add('hidden');

    // Perform page-specific rendering
    if (pageId === 'calendar') {
        initializeCalendar();
        renderCalendar();
    } else if (pageId === 'team') {
        renderTeamMembers();
        updateTeamStats(); // Ensure stats are up-to-date
    } else if (pageId === 'dashboard') {
        displayChatHistory('general'); // Display general chat history on dashboard
        if (app.allTasks.length > 0) {
            displayGeneratedTasks(app.allTasks); // Display summary of generated tasks
        } else {
            elements.dashboardContent.innerHTML = `<p class="text-gray-500">Welcome to your HackManager dashboard! Chat with the AI below to get started, or check your Calendar and Team settings.</p>`;
        }
    } else if (pageId === 'settings') {
        initializeUI(); // Re-initialize settings UI to reflect current state
    }
    saveToLocalStorage(); // Save current page (optional for dashboard, but good for consistency)
}

/**
 * Initializes UI components and renders initial states based on app data.
 * This is primarily for the Dashboard's forms and dynamic elements.
 */
function initializeUI() {
    // Set initial values for settings form from app state
    if (elements.hackathonName) elements.hackathonName.value = app.hackathonSettings.name || '';
    if (elements.startDate && app.hackathonSettings.startDate) {
        elements.startDate.value = formatDateTimeLocal(app.hackathonSettings.startDate);
    }
    if (elements.duration) elements.duration.value = app.hackathonSettings.duration || '48';

    // Set initial project idea (for settings page)
    if (elements.projectIdeaInput) {
        elements.projectIdeaInput.value = app.projectIdea || '';
    }

    // Set AI provider and model based on local storage
    const savedAIProvider = localStorage.getItem('ai_provider') || 'google'; // Default to Google
    if (elements.aiProviderSelect) {
        elements.aiProviderSelect.value = savedAIProvider;
        toggleApiKeyInput(savedAIProvider); // This will also set up models
    }
}

/**
 * Sets up all global event listeners for UI interactions on the dashboard.
 */
function setupEventListeners() {
    // Sidebar navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(e.currentTarget.dataset.page);
        });
    });

    // Mobile sidebar toggle
    if (elements.sidebarToggle && elements.mainSidebar && elements.sidebarOverlay) {
        elements.sidebarToggle.addEventListener('click', () => {
            elements.mainSidebar.classList.toggle('-translate-x-full'); // Toggle class for animation
            elements.sidebarOverlay.classList.toggle('hidden');
        });

        elements.sidebarOverlay.addEventListener('click', () => {
            elements.mainSidebar.classList.add('-translate-x-full');
            elements.sidebarOverlay.classList.add('hidden');
        });
    }

    // Settings form submission
    if (elements.settingsForm) {
        elements.settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

    // Add team member button (main team page)
    if (elements.addMemberBtn) {
        elements.addMemberBtn.addEventListener('click', handleAddMember);
    }

    // Export/Import/Clear data buttons
    if (elements.exportDataBtn) {
        elements.exportDataBtn.addEventListener('click', exportData);
    }
    if (elements.importDataInput) {
        elements.importDataInput.addEventListener('change', handleImportData);
    }
    if (elements.clearDataBtn) {
        elements.clearDataBtn.addEventListener('click', clearLocalStorage);
    }

    // General Chat Form (Dashboard)
    if (elements.generalChatForm) {
        elements.generalChatForm.addEventListener('submit', handleGeneralChatSubmit);
    }

    // AI Provider selection change
    if (elements.aiProviderSelect) {
        elements.aiProviderSelect.addEventListener('change', (e) => {
            const selectedProvider = e.target.value;
            localStorage.setItem('ai_provider', selectedProvider);
            toggleApiKeyInput(selectedProvider);
            elements.apiKeyInput.value = localStorage.getItem(`${selectedProvider}_api_key`) || '';
        });
    }

    // AI Model selection change
    if (elements.aiModelSelect) {
        elements.aiModelSelect.addEventListener('change', (e) => {
            const currentProvider = elements.aiProviderSelect.value;
            localStorage.setItem(`${currentProvider}_model`, e.target.value); // Save model per provider
        });
    }

    // API Key input change (save key to local storage)
    if (elements.apiKeyInput) {
        elements.apiKeyInput.addEventListener('input', (e) => {
            const currentProvider = elements.aiProviderSelect.value;
            localStorage.setItem(`${currentProvider}_api_key`, e.target.value);
        });
    }

    // Custom endpoint input change (save endpoint to local storage)
    if (elements.apiEndpointInput) {
        elements.apiEndpointInput.addEventListener('input', (e) => {
            localStorage.setItem('other_endpoint', e.target.value);
        });
    }
}

/**
 * Toggles the visibility of the API Key and Custom Endpoint inputs based on the selected AI provider.
 * Also dynamically loads appropriate models for the selected provider.
 * @param {string} provider - The selected AI provider (e.g., 'groq', 'openai').
 */
function toggleApiKeyInput(provider) {
    const apiKeySection = document.getElementById('api-key-section');
    const customEndpointSection = document.getElementById('custom-endpoint-section');

    if (apiKeySection) {
        if (provider === 'google') { // Google Gemini Flash API key is provided by the environment
            apiKeySection.classList.add('hidden');
        } else {
            apiKeySection.classList.remove('hidden');
        }
    }

    if (customEndpointSection) {
        if (provider === 'other') {
            customEndpointSection.classList.remove('hidden');
            elements.apiEndpointInput.value = localStorage.getItem('other_endpoint') || '';
        } else {
            customEndpointSection.classList.add('hidden');
        }
    }

    // Update model options and label based on provider
    if (elements.aiModelSelect) {
        elements.aiModelSelect.innerHTML = ''; // Clear existing options
        let models = [];
        let labelText = 'AI Model';

        switch (provider) {
            case 'openai':
                models = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
                labelText = 'OpenAI Model';
                break;
            case 'anthropic':
                models = ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
                labelText = 'Anthropic Model';
                break;
            case 'google':
                models = ['gemini-2.0-flash', 'gemini-pro']; // gemini-2.0-flash is recommended
                labelText = 'Google Model';
                break;
            case 'groq':
                models = ['llama3-8b-8192', 'mixtral-8x7b-32768', 'llama2-70b-4096'];
                labelText = 'Groq Model';
                break;
            case 'cohere':
                models = ['command-r-plus', 'command-r', 'command', 'command-light'];
                labelText = 'Cohere Model';
                break;
            default: // 'other' or custom
                models = ['custom-model'];
                labelText = 'Custom Model';
                break;
        }

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            elements.aiModelSelect.appendChild(option);
        });

        // Set saved model for the current provider or default to the first model
        const savedModel = localStorage.getItem(`${provider}_model`);
        if (savedModel && models.includes(savedModel)) {
            elements.aiModelSelect.value = savedModel;
        } else if (models.length > 0) {
            elements.aiModelSelect.value = models[0]; // Default to the first model in the list
            localStorage.setItem(`${provider}_model`, models[0]);
        }
    }

    if (elements.aiModelLabel) {
        elements.aiModelLabel.textContent = labelText;
    }
}

/**
 * Display custom message/alert modal.
 * @param {string} title - The title of the message.
 * @param {string} message - The body of the message.
 * @param {'alert'|'confirm'} type - Type of modal: 'alert' for OK button, 'confirm' for Confirm/Cancel.
 * @param {function} onConfirm - Callback function when Confirm/OK is clicked.
 * @param {function} [onCancel] - Callback function when Cancel is clicked (only for 'confirm' type).
 */
function showMessage(title, message, type = 'alert', onConfirm = null, onCancel = null) {
    elements.customMessageTitle.textContent = title;
    elements.customMessageBody.textContent = message;

    elements.customMessageConfirmBtn.classList.add('hidden');
    elements.customMessageCancelBtn.classList.add('hidden');
    elements.customMessageOkBtn.classList.add('hidden');

    // Clear previous event listeners to prevent multiple firings
    elements.customMessageConfirmBtn.onclick = null;
    elements.customMessageCancelBtn.onclick = null;
    elements.customMessageOkBtn.onclick = null;

    if (type === 'confirm') {
        elements.customMessageConfirmBtn.classList.remove('hidden');
        elements.customMessageCancelBtn.classList.remove('hidden');
        elements.customMessageConfirmBtn.onclick = () => {
            hideMessage();
            if (onConfirm) onConfirm();
        };
        elements.customMessageCancelBtn.onclick = () => {
            hideMessage();
            if (onCancel) onCancel();
        };
    } else { // type is 'alert' or default
        elements.customMessageOkBtn.classList.remove('hidden');
        elements.customMessageOkBtn.onclick = () => {
            hideMessage();
            if (onConfirm) onConfirm(); // Use onConfirm for OK action for consistency
        };
    }
    elements.customMessageModal.classList.remove('hidden');
}

/**
 * Hides the custom message/alert modal.
 */
function hideMessage() {
    elements.customMessageModal.classList.add('hidden');
}


// ========== Settings Page Functions ==========

/**
 * Handles the submission of the settings form.
 * Updates hackathon settings and project idea, then saves to local storage.
 * @param {Event} event - The form submission event.
 */
function handleSettingsSubmit(event) {
    event.preventDefault();
    app.hackathonSettings.name = elements.hackathonName.value;
    app.hackathonSettings.startDate = new Date(elements.startDate.value);
    app.hackathonSettings.duration = parseInt(elements.duration.value);
    app.projectIdea = elements.projectIdeaInput.value; // Save project idea from settings page

    saveToLocalStorage();
    showMessage('Settings Saved', 'Your hackathon settings have been updated!', 'alert');
    updateTeamStats(); // Update stats in case duration changed
    if (app.currentPage === 'calendar') {
        initializeCalendar(); // Re-initialize calendar if settings changed
        renderCalendar();
    }
}


// ========== Team Member Management Functions ==========

/**
 * Adds a new team member to the application state.
 * @param {object} memberData - Object containing member details (name, sleepStart, sleepEnd, skills).
 * @returns {object} The newly created member object.
 */
function addTeamMember(memberData) {
    const newMember = {
        id: generateId(),
        name: memberData.name,
        sleepStart: memberData.sleepStart,
        sleepEnd: memberData.sleepEnd,
        skills: memberData.skills.map(s => s.trim()).filter(s => s) || [], // Ensure skills are trimmed and not empty
        colorIndex: app.teamMembers.length % 8 // Assign a color
    };
    app.teamMembers.push(newMember);
    saveToLocalStorage();
    renderTeamMembers();
    updateTeamStats();
    return newMember;
}

/**
 * Updates an existing team member's details.
 * @param {string} memberId - The ID of the member to update.
 * @param {object} updates - Object containing the properties to update.
 */
function updateTeamMember(memberId, updates) {
    const memberIndex = app.teamMembers.findIndex(m => m.id === memberId);
    if (memberIndex !== -1) {
        // Ensure skills are processed if provided in updates
        if (updates.skills && typeof updates.skills === 'string') {
            updates.skills = updates.skills.split(',').map(s => s.trim()).filter(s => s);
        }
        app.teamMembers[memberIndex] = { ...app.teamMembers[memberIndex], ...updates };
        saveToLocalStorage();
        renderTeamMembers();
        updateTeamStats();
        // Re-render tasks and calendar if assigned member info changes
        if (app.currentPage === 'calendar') {
            renderTasks();
            renderCalendar();
        }
    }
}

/**
 * Deletes a team member and unassigns their tasks.
 * Uses a custom confirm modal instead of browser's `confirm`.
 * @param {string} memberId - The ID of the member to delete.
 */
function deleteTeamMember(memberId) {
    showMessage('Confirm Deletion', 'Are you sure you want to delete this team member? All their assigned tasks will become unassigned.', 'confirm', () => {
        app.teamMembers = app.teamMembers.filter(member => member.id !== memberId);
        // Unassign tasks from this member
        app.allTasks.forEach(task => {
            if (Array.isArray(task.assignedTo)) {
                task.assignedTo = task.assignedTo.filter(id => id !== memberId);
            } else if (task.assignedTo === memberId) {
                task.assignedTo = []; // Clear assignment if it was a single string
            }
        });
        saveToLocalStorage();
        app.selectedMemberId = null; // Clear selection
        renderTeamMembers();
        updateTeamStats();
        if (app.currentPage === 'calendar') {
            renderTasks();
            renderCalendar();
        }
        showMessage('Member Deleted', 'Team member deleted successfully.', 'alert');
    });
}

/**
 * Handles the click event for adding a new member, opening the form.
 */
function handleAddMember() {
    renderMemberDetailsForm(null); // Render the add/edit member form in the details section
}

/**
 * Renders the list of team members and the details/add form.
 */
function renderTeamMembers() {
    if (!elements.teamMembersSimpleList || !elements.memberDetails) return;

    elements.teamMembersSimpleList.innerHTML = '';
    if (app.teamMembers.length === 0) {
        elements.teamMembersSimpleList.innerHTML = '<p class="text-gray-500">No team members added yet.</p>';
    }

    app.teamMembers.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = `flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${app.selectedMemberId === member.id ? 'bg-blue-800 border border-blue-600' : 'bg-gray-800 shadow-sm'}`;
        memberDiv.innerHTML = `
            <span class="team-badge team-member-${(member.colorIndex % 8) + 1} text-sm">${member.name}</span>
            <div class="text-xs text-gray-400">Sleep: ${member.sleepStart}-${member.sleepEnd}</div>
        `;
        memberDiv.onclick = () => selectMember(member.id);
        elements.teamMembersSimpleList.appendChild(memberDiv);
    });

    // Render selected member's details or default message
    if (app.selectedMemberId) {
        renderMemberDetailsForm(app.selectedMemberId);
    } else {
        elements.memberDetails.innerHTML = '<p class="text-gray-500">Select a member from the list to view/edit details.</p>';
    }
}

/**
 * Selects a team member to display their details for editing.
 * @param {string} memberId - The ID of the member to select.
 */
function selectMember(memberId) {
    app.selectedMemberId = memberId;
    renderTeamMembers(); // Re-render list to highlight selected member
    renderMemberDetailsForm(memberId);
}

/**
 * Renders the form for adding a new team member or editing an existing one.
 * @param {string|null} memberId - The ID of the member to edit, or null to add a new member.
 */
function renderMemberDetailsForm(memberId) {
    const isEditing = memberId !== null;
    const member = isEditing ? app.teamMembers.find(m => m.id === memberId) : null;

    if (!elements.memberDetails) return;

    elements.memberDetails.innerHTML = `
        <h4 class="font-semibold text-lg mb-4 text-blue-300">${isEditing ? 'Edit Team Member' : 'Add New Team Member'}</h4>
        <form id="member-form" class="space-y-4">
            <div>
                <label for="member-name" class="form-label">Name</label>
                <input type="text" id="member-name" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500"
                           value="${member ? member.name : ''}" required>
            </div>
            <div>
                <label for="member-sleep-start" class="form-label">Sleep Start (24h format)</label>
                <input type="time" id="member-sleep-start" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500"
                           value="${member ? member.sleepStart : '23:00'}" required>
            </div>
            <div>
                <label for="member-sleep-end" class="form-label">Sleep End (24h format)</label>
                <input type="time" id="member-sleep-end" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500"
                           value="${member ? member.sleepEnd : '07:00'}" required>
            </div>
            <div>
                <label class="form-label">Skills (comma-separated, e.g., Frontend, Backend, UI/UX)</label>
                <input type="text" id="member-skills" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500"
                           value="${member && member.skills ? member.skills.join(', ') : ''}">
            </div>
            <div class="flex justify-end gap-3 pt-4">
                ${isEditing ? `
                    <button type="button" onclick="deleteTeamMember('${memberId}')" class="btn bg-red-600 hover:bg-red-700">Delete Member</button>
                ` : ''}
                <button type="submit" class="btn">
                    ${isEditing ? 'Update Member' : 'Add Member'}
                </button>
            </div>
        </form>
    `;

    document.getElementById('member-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('member-name').value;
        const sleepStart = document.getElementById('member-sleep-start').value;
        const sleepEnd = document.getElementById('member-sleep-end').value;
        const skills = document.getElementById('member-skills').value; // Get as string, will process in add/update

        const memberData = { name, sleepStart, sleepEnd, skills };

        if (isEditing) {
            updateTeamMember(memberId, memberData);
            showMessage('Member Updated', 'Team member details updated successfully.', 'alert');
        } else {
            addTeamMember(memberData);
            showMessage('Member Added', 'New team member added successfully.', 'alert');
            // Clear the form after adding to allow adding another quickly
            document.getElementById('member-form').reset();
            elements.memberDetails.innerHTML = '<p class="text-gray-500">Select a member from the list to view/edit details.</p>'; // Reset to default message
            app.selectedMemberId = null; // Deselect after adding
            renderTeamMembers(); // Re-render list
        }
    });
}

/**
 * Updates and displays the team statistics.
 */
function updateTeamStats() {
    if (!elements.teamStats) return;

    const totalMembers = app.teamMembers.length;
    const totalTasks = app.allTasks.length;
    const completedTasks = app.allTasks.filter(task => task.status === 'Completed').length;

    let totalEstimatedHours = 0;
    app.allTasks.forEach(task => {
        totalEstimatedHours += task.estimatedHours || 0;
    });

    let currentWorkload = {};
    app.teamMembers.forEach(member => {
        currentWorkload[member.id] = {
            name: member.name,
            tasksAssigned: 0,
            hoursAssigned: 0
        };
    });

    app.allTasks.forEach(task => {
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
        assignees.forEach(memberId => {
            if (currentWorkload[memberId]) {
                currentWorkload[memberId].tasksAssigned++;
                currentWorkload[memberId].hoursAssigned += task.estimatedHours || 0;
            }
        });
    });

    let workloadHtml = '';
    if (totalMembers > 0) {
        workloadHtml = `
            <h5 class="font-semibold text-orange-300 mt-4 mb-2">Individual Workload:</h5>
            <ul class="space-y-2">
                ${Object.values(currentWorkload).map(work => `
                    <li class="flex justify-between items-center bg-gray-700 p-2 rounded-md shadow-sm">
                        <span>${work.name}</span>
                        <span class="text-sm text-gray-400">${work.tasksAssigned} tasks, ${work.hoursAssigned} hours</span>
                    </li>
                `).join('')}
            </ul>
        `;
    } else {
        workloadHtml = '<p class="text-gray-500 mt-4">Add team members to see individual workloads.</p>';
    }


    elements.teamStats.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-blue-900 p-4 rounded-lg">
                <p class="text-sm text-blue-300">Total Team Members</p>
                <p class="text-2xl font-bold text-white">${totalMembers}</p>
            </div>
            <div class="bg-green-900 p-4 rounded-lg">
                <p class="text-sm text-green-300">Total Tasks</p>
                <p class="text-2xl font-bold text-white">${totalTasks}</p>
            </div>
            <div class="bg-yellow-900 p-4 rounded-lg">
                <p class="text-sm text-yellow-300">Tasks Completed</p>
                <p class="text-2xl font-bold text-white">${completedTasks} / ${totalTasks}</p>
            </div>
        </div>
        ${workloadHtml}
    `;
}

// ========== AI Assistant Functions ==========

/**
 * Handles the submission of the general chat form, sending the user's message to the AI.
 * This is for post-onboarding interactions on the Dashboard.
 * @param {Event} event - The form submission event.
 */
async function handleGeneralChatSubmit(event) {
    event.preventDefault();
    const userMessage = elements.generalChatInput.value.trim();

    if (!userMessage) return;

    app.chatHistory.general.push({ role: 'user', content: userMessage });
    displayChatHistory('general');
    elements.generalChatInput.value = ''; // Clear input field
    elements.generalChatInput.disabled = true;

    // Add loading indicator
    addMessageToChatHistory('general', 'ai', 'AI is thinking...');
    scrollChatToBottom(elements.dashboardContent); // elements.dashboardContent is now the chat history container

    try {
        const selectedProvider = elements.aiProviderSelect.value;
        const projectIdeaContext = app.projectIdea || 'No project idea provided yet.';

        const prompt = `You are a hackathon project manager AI. Based on the current project idea "${projectIdeaContext}", and the user's request, provide helpful advice or perform requested actions.
        
        Current Team Members: ${app.teamMembers.map(m => m.name).join(', ') || 'None'}
        Current Tasks: ${app.allTasks.map(t => `${t.title} (Status: ${t.status}, Assigned: ${t.assignedTo.map(id => app.teamMembers.find(tm => tm.id === id)?.name || 'Unknown').join(', ')})`).join('; ') || 'None'}
        
        User Request: "${userMessage}"
        
        If the user asks for new tasks or to modify existing tasks, generate JSON for tasks following this schema:
        {
            "action": "update_tasks",
            "tasks": [
                {
                    "id": "existing_id_or_new_id", // Keep existing ID if updating, generate new if new task
                    "title": "string",
                    "description": "string",
                    "phase": "planning|design|development|integration|testing|presentation",
                    "estimatedHours": "number",
                    "priority": "high|medium|low",
                    "assignedTo": ["member_id1", "member_id2"], // Array of member IDs (use member names for AI input, convert to IDs after response)
                    "status": "Not Started|In Progress|Completed|Blocked"
                }
            ]
        }
        
        If no task modification is requested, provide a conversational response.`;
        
        // Use the general call to Gemini API. No explicit schema here, we'll check response format.
        const responseText = await callGeminiAPI(prompt, selectedProvider);

        let aiContent = responseText;
        let actionHandled = false;

        try {
            const parsedResponse = JSON.parse(responseText);
            if (parsedResponse.action === 'update_tasks' && Array.isArray(parsedResponse.tasks)) {
                parsedResponse.tasks.forEach(taskData => {
                    // Convert assignedTo names from AI response to actual member IDs
                    const assignedToIds = Array.isArray(taskData.assignedTo)
                        ? taskData.assignedTo.map(name => {
                            const member = app.teamMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
                            return member ? member.id : null;
                        }).filter(id => id !== null)
                        : [];
                    
                    const taskToUpdate = { ...taskData, assignedTo: assignedToIds };

                    const existingTask = app.allTasks.find(t => t.id === taskData.id);
                    if (existingTask) {
                        updateTask(taskToUpdate.id, taskToUpdate);
                        aiContent = `Updated task: "${taskToUpdate.title}".`;
                    } else {
                        // Ensure new tasks have default dates if not provided by AI
                        if (!taskToUpdate.startDate) taskToUpdate.startDate = new Date();
                        if (!taskToUpdate.endDate) taskToUpdate.endDate = addHours(taskToUpdate.startDate, taskToUpdate.estimatedHours || 1);
                        createTask(taskToUpdate);
                        aiContent = `Added new task: "${taskToUpdate.title}".`;
                    }
                });
                showMessage('Tasks Updated!', 'AI has updated/added tasks. Check the Calendar or Team page.', 'alert');
                actionHandled = true;
            }
        } catch (e) {
            // Not a JSON response, treat as conversational
            console.log('AI response was not JSON or did not contain task update action.', e);
        }

        if (!actionHandled) {
            addMessageToChatHistory('general', 'ai', aiContent);
        }

        elements.generalChatInput.disabled = false;
        scrollChatToBottom(elements.dashboardContent);
        saveToLocalStorage(); // Save after any updates
        updateTeamStats(); // Re-calculate stats
        renderCalendar(); // Re-render calendar if tasks changed

    } catch (error) {
        console.error('Error in general chat:', error);
        addMessageToChatHistory('general', 'ai', `Sorry, I encountered an error: ${error.message}. Please try again.`);
        elements.generalChatInput.disabled = false;
        scrollChatToBottom(elements.dashboardContent);
    }
}

/**
 * Handles the actual API call to the selected AI model.
 * @param {string} prompt - The text prompt to send to the AI.
 * @param {string} provider - The selected AI provider (e.g., 'google', 'openai').
 * @param {object} [outputSchema=null] - Optional JSON schema for structured output.
 * @returns {Promise<string|object>} A promise that resolves to the AI's response (string or parsed JSON).
 */
async function callGeminiAPI(prompt, provider, outputSchema = null) {
    const apiKey = localStorage.getItem(`${provider}_api_key`) || '';
    const selectedModel = localStorage.getItem(`${provider}_model`);
    let apiUrl;
    let payload;
    let headers = { 'Content-Type': 'application/json' };

    switch (provider) {
        case 'google':
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=`; // Key handled by Canvas
            payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4000,
                    responseMimeType: outputSchema ? "application/json" : undefined,
                    responseSchema: outputSchema || undefined
                }
            };
            break;
        case 'openai':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            payload = {
                model: selectedModel,
                messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 4000,
                response_format: outputSchema ? { type: "json_object" } : undefined
            };
            break;
        case 'anthropic':
            apiUrl = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            payload = {
                model: selectedModel,
                max_tokens: 4000,
                temperature: 0.7,
                system: 'You are a helpful assistant.',
                messages: [{ role: 'user', content: prompt }]
            };
            break;
        case 'groq':
            apiUrl = '/groq'; // Use the local proxy endpoint
            payload = {
                model: selectedModel,
                messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 4000
            };
            // Note: Groq proxy doesn't handle response_format for now, will parse manually
            break;
        case 'cohere':
            apiUrl = 'https://api.cohere.ai/v1/chat';
            headers['Authorization'] = `Bearer ${apiKey}`;
            payload = {
                model: selectedModel,
                message: prompt,
                temperature: 0.7,
                preamble: 'You are a helpful assistant.',
                response_format: outputSchema ? { type: "json_object" } : undefined
            };
            break;
        case 'other':
            apiUrl = localStorage.getItem('other_endpoint');
            headers['Authorization'] = `Bearer ${apiKey}`;
            payload = {
                model: selectedModel,
                messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 4000,
                response_format: outputSchema ? { type: "json_object" } : undefined
            };
            break;
        default:
            throw new Error('Invalid AI provider selected.');
    }

    if (!apiKey && provider !== 'google' && provider !== 'groq') {
        throw new Error(`API key for ${provider} is not set. Please go to Settings to enter it.`);
    }
    if (provider === 'other' && !apiUrl) {
        throw new Error('Custom API Endpoint is not set for "Other" provider. Please go to Settings to enter it.');
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData);
            throw new Error(`API request failed: ${errorMessage}`);
        }

        const data = await response.json();
        let aiResponseContent;
        
        // Extract response based on provider format
        if (provider === 'anthropic') {
            aiResponseContent = data.content[0].text;
        } else if (provider === 'google') {
            aiResponseContent = data.candidates[0].content.parts[0].text;
        } else if (provider === 'cohere') {
            aiResponseContent = data.text;
        } else {
            // OpenAI, Groq, and compatible providers
            aiResponseContent = data.choices[0].message.content;
        }

        if (outputSchema) {
            try {
                // For Groq (if not returning JSON directly), try to extract from markdown block
                if (provider === 'groq' && !outputSchema.responseMimeType) {
                    const jsonMatch = aiResponseContent.match(/```json\n([\s\S]*?)\n```/);
                    if (jsonMatch && jsonMatch[1]) {
                        return JSON.parse(jsonMatch[1]);
                    }
                }
                return JSON.parse(aiResponseContent); // Attempt to parse JSON if schema was requested
            } catch (parseError) {
                console.error('Failed to parse AI response as JSON with schema:', aiResponseContent, parseError);
                throw new Error('AI response was not valid JSON for the requested schema.');
            }
        }
        return aiResponseContent; // Return plain text if no schema
        
    } catch (error) {
        console.error(`API error for ${provider}:`, error);
        throw error;
    }
}


/**
 * Displays the chat history messages in the general chat container (dashboard).
 * @param {'general'} chatType - The type of chat history to display.
 */
function displayChatHistory(chatType) {
    if (chatType !== 'general' || !elements.dashboardContent) return;

    elements.dashboardContent.innerHTML = ''; // Clear existing messages
    app.chatHistory.general.forEach(msg => {
        addMessageToChatHistory(chatType, msg.role, msg.content, false); // Add without scrolling initially
    });
    // Scroll to bottom after all messages are added
    scrollChatToBottom(elements.dashboardContent);
}

/**
 * Adds a single message to the specified chat history and optionally scrolls to bottom.
 * @param {'general'} chatType - The type of chat history to add to.
 * @param {'user'|'ai'} role - The sender of the message.
 * @param {string} content - The message content.
 * @param {boolean} [doScroll=true] - Whether to scroll to the bottom after adding.
 */
function addMessageToChatHistory(chatType, role, content, doScroll = true) {
    if (chatType !== 'general' || !elements.dashboardContent) return;

    // Only push if it's not a temporary loading message
    if (content.indexOf('Thinking and generating tasks...') === -1 && content.indexOf('AI is thinking...') === -1 && content.indexOf('AI is windin\' up!') === -1) {
        // Prevent duplicate messages if already in history (e.g., from loading)
        const lastMsg = app.chatHistory.general[app.chatHistory.general.length - 1];
        if (!lastMsg || !(lastMsg.role === role && lastMsg.content === content)) {
            app.chatHistory.general.push({ role, content });
        }
    }


    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg mb-2 ${role === 'user' ? 'bg-blue-700 self-end text-right ml-auto text-white' : 'bg-gray-700 self-start text-left mr-auto text-gray-100'}`;
    messageDiv.style.maxWidth = '80%';
    messageDiv.dataset.role = role; // Custom attribute to easily identify AI messages

    messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'AI'}:</strong> ${content}`;
    elements.dashboardContent.appendChild(messageDiv);

    if (doScroll) {
        scrollChatToBottom(elements.dashboardContent);
    }
}

/**
 * Scrolls a given chat container to its bottom.
 * @param {HTMLElement} container - The scrollable chat container.
 */
function scrollChatToBottom(container) {
    container.scrollTop = container.scrollHeight;
}

/**
 * Display generated tasks in the UI on the Dashboard page.
 * This is a summary view.
 * @param {Array<object>} tasks - Array of task objects.
 */
function displayGeneratedTasks(tasks) {
    if (!elements.dashboardContent) return; // Ensure dashboard content element exists

    const tasksByPhase = tasks.reduce((acc, task) => {
        if (!acc[task.phase]) acc[task.phase] = [];
        acc[task.phase].push(task);
        return acc;
    }, {});
    
    let html = `
        <div class="space-y-6 mb-6">
            <h4 class="text-xl font-semibold text-blue-300">✨ AI Generated ${tasks.length} Tasks</h4>
            <p class="text-gray-300">Based on your project idea, I've created a comprehensive task breakdown optimized for your ${app.hackathonSettings.duration}-hour hackathon with ${app.teamMembers.length} team members.</p>
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
                <h5 class="font-semibold text-lg mb-3 text-orange-300">${phaseNames[phase] || phase}</h5>
                <div class="space-y-2">
        `;
        
        phaseTasks.forEach(task => {
            const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
            const assignedMembers = assignees.map(id => app.teamMembers.find(m => m.id === id)).filter(m => m);
            
            html += `
                <div class="bg-gray-700 p-3 rounded">
                    <div class="flex justify-between items-start">
                        <strong class="text-white">${task.title}</strong>
                        <div class="flex gap-1 flex-wrap">
                            ${assignedMembers.map(member => `
                                <span class="team-badge team-member-${(member.colorIndex % 8) + 1} text-xs">
                                    ${member.name}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <p class="text-sm text-gray-300 mt-1">${task.description}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs text-gray-400">${formatDate(task.startDate)} - ${formatDate(task.endDate)}</span>
                        <span class="text-xs px-2 py-1 rounded-full bg-gray-600 text-gray-200">${task.status || 'Not Started'}</span>
                    </div>
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
                <button onclick="showPage('calendar')" class="btn">
                    View in Calendar
                </button>
                <button onclick="exportData()" class="btn bg-gray-600 hover:bg-gray-700">
                    Export All Data
                </button>
            </div>
        </div>
    `;
    
    elements.dashboardContent.innerHTML = html;
}

/**
 * Exports all application data (settings, team, tasks, project idea, chat history) as a JSON file.
 */
function exportData() {
    const exportDataObject = {
        projectIdea: app.projectIdea,
        hackathonSettings: app.hackathonSettings,
        teamMembers: app.teamMembers,
        allTasks: app.allTasks,
        chatHistory: app.chatHistory
    };
    
    const dataStr = JSON.stringify(exportDataObject, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hackmanager_data-${app.hackathonSettings.name || 'project'}-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

/**
 * Handles importing application data from a JSON file.
 * @param {Event} event - The file input change event.
 */
function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            showMessage('Confirm Import', 'Are you sure you want to import data? This will overwrite your current data.', 'confirm', () => {
                // Clear existing data first
                localStorage.clear(); // Clears all items from localStorage

                // Load imported data into app state
                if (importedData.hackathonSettings) {
                    app.hackathonSettings = importedData.hackathonSettings;
                    if (app.hackathonSettings.startDate) {
                        app.hackathonSettings.startDate = new Date(importedData.hackathonSettings.startDate); // Ensure it's Date object
                    }
                }
                if (importedData.teamMembers) {
                    app.teamMembers = importedData.teamMembers;
                }
                if (importedData.allTasks) {
                    app.allTasks = importedData.allTasks;
                    app.allTasks.forEach(task => {
                        if (task.startDate) task.startDate = new Date(task.startDate);
                        if (task.endDate) task.endDate = new Date(task.endDate);
                        if (!Array.isArray(task.assignedTo)) {
                            task.assignedTo = task.assignedTo ? [task.assignedTo] : [];
                        }
                    });
                }
                if (importedData.projectIdea) {
                    app.projectIdea = importedData.projectIdea;
                }
                
                // Also import chat history if present in the imported data
                if (importedData.chatHistory) {
                    app.chatHistory = importedData.chatHistory;
                } else { // Initialize if not present or old format
                     app.chatHistory = {
                        general: []
                    };
                }
                
                // Mark onboarding as seen if import is successful and has core data
                if (app.hackathonSettings.name && app.teamMembers.length > 0 && app.allTasks.length > 0) {
                    localStorage.setItem('hasSeenOnboarding', 'true');
                } else {
                    localStorage.removeItem('hasSeenOnboarding'); // Ensure onboarding is not skipped if data is incomplete
                }

                saveToLocalStorage();
                initializeUI(); // Re-initialize UI with new data
                
                showMessage('Import Successful', 'Data imported successfully. Your application has been updated.', 'alert', () => {
                    // Redirect to dashboard (or onboarding if incomplete data was imported)
                    window.location.reload(); // Simplest way to re-evaluate initial state and navigation
                });
            }, () => {
                showMessage('Import Cancelled', 'Data import cancelled.', 'alert');
            });
            
        } catch (error) {
            console.error('Error importing data:', error);
            showMessage('Import Error', `Failed to import data: ${error.message}. Please ensure the file is a valid JSON.`, 'alert');
        }
    };
    reader.readAsText(file);
}


// ========== Task Management Functions ==========

/**
 * Creates a new task and adds it to the application state.
 * @param {object} taskData - Object containing task details.
 * @returns {object} The newly created task object.
 */
function createTask(taskData) {
    const task = {
        id: generateId(),
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        startDate: taskData.startDate || new Date(),
        endDate: taskData.endDate || new Date(),
        assignedTo: taskData.assignedTo || [], // Changed to array for multiple assignees
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

/**
 * Updates an existing task's details.
 * @param {string} taskId - The ID of the task to update.
 * @param {object} updates - Object containing the properties to update.
 */
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

/**
 * Deletes a task from the application state.
 * Also removes this task from any other tasks' dependencies.
 * @param {string} taskId - The ID of the task to delete.
 */
function deleteTask(taskId) {
    showMessage('Confirm Deletion', 'Are you sure you want to delete this task? This action cannot be undone.', 'confirm', () => {
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
        showMessage('Task Deleted', 'Task deleted successfully.', 'alert');
    });
}

/**
 * Renders all tasks (currently not used to display on AI Assistant page, but could be).
 */
function renderTasks() {
    // This function is generally used by Calendar and Team pages.
    // The Dashboard now uses displayGeneratedTasks for a summary.
    // If you add a dedicated "All Tasks" list on the Dashboard or elsewhere,
    // this function would be used for its rendering.
    updateTeamStats(); // Ensure stats are always up-to-date
}

// Filter tasks (placeholder)
function filterTasks(criteria) {
    // Placeholder function
    // Will filter tasks based on criteria
}

// ========== Calendar Functions ==========

/**
 * Initializes the calendar by calculating days based on hackathon settings.
 */
function initializeCalendar() {
    // Calculate calendar days based on hackathon settings
    if (!validateHackathonSettings()) {
        return;
    }
    
    const startDate = new Date(app.hackathonSettings.startDate);
    const duration = app.hackathonSettings.duration;
    const endDate = calculateEndDate(startDate, duration);
    
    app.calendarData.days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        app.calendarData.days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

/**
 * Renders the full calendar view, including time column, grid, and tasks.
 */
function renderCalendar() {
    if (!validateHackathonSettings()) {
        elements.calendarContainer.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p>Please configure hackathon settings first (Start Date and Duration).</p>
                <button onclick="showPage('settings')" class="btn bg-blue-600 hover:bg-blue-700 mt-4">
                    Go to Settings
                </button>
            </div>
        `;
        // Clear headers/time column if settings are invalid
        if (elements.timeColumn) elements.timeColumn.innerHTML = '';
        if (elements.calendarDaysHeader) elements.calendarDaysHeader.innerHTML = '';
        if (elements.calendarDateRange) elements.calendarDateRange.textContent = '';
        if (elements.teamMembersCalendarList) elements.teamMembersCalendarList.innerHTML = '<p class="text-gray-500 text-xs text-center">No team members to display.</p>';
        return;
    }
    
    // Update date range display
    if (elements.calendarDateRange) {
        elements.calendarDateRange.textContent = `${formatFullDate(app.hackathonSettings.startDate)} - ${formatFullDate(calculateEndDate(app.hackathonSettings.startDate, app.hackathonSettings.duration))}`;
    }
    
    // Render time column
    renderTimeColumn();
    
    // Render calendar grid
    renderCalendarGrid();
    
    // Render team members sidebar
    renderTeamMembersSidebar();
}

/**
 * Renders the time column on the left side of the calendar grid.
 */
function renderTimeColumn() {
    const timeColumn = elements.timeColumn;
    if (!timeColumn) return;
    
    timeColumn.innerHTML = '';
    
    // Calculate total hours and create time slots
    const startDate = new Date(app.hackathonSettings.startDate);
    const totalHours = app.hackathonSettings.duration;
    
    // Ensure the time column height matches the grid height for synchronized scrolling
    timeColumn.style.height = `${totalHours * 80}px`; 
    
    for (let i = 0; i <= totalHours; i++) {
        const currentHour = new Date(startDate);
        currentHour.setHours(currentHour.getHours() + i);
        
        const timeSlot = document.createElement('div');
        timeSlot.className = 'absolute w-full text-xs text-gray-400 px-2';
        timeSlot.style.top = `${i * 80}px`; // Position each hour marker
        timeSlot.textContent = currentHour.getHours().toString().padStart(2, '0') + ':00';
        
        timeColumn.appendChild(timeSlot);
    }
}

/**
 * Renders the main calendar grid, including day headers and task elements.
 */
function renderCalendarGrid() {
    const container = elements.calendarContainer;
    const daysHeader = elements.calendarDaysHeader;
    const scrollContainer = elements.calendarScrollContainer;
    const scrollbar = elements.calendarScrollbar;
    const scrollbarContent = elements.scrollbarContent;
    
    if (!container || !daysHeader || !scrollContainer || !scrollbar || !scrollbarContent) return;
    
    container.innerHTML = '';
    daysHeader.innerHTML = '';
    
    const startDate = new Date(app.hackathonSettings.startDate);
    const endDate = calculateEndDate(startDate, app.hackathonSettings.duration);
    const totalMilliseconds = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(totalMilliseconds / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
    
    const minColumnWidth = 150;
    const totalWidth = Math.max(days * minColumnWidth, scrollContainer.offsetWidth); // Ensure it's at least as wide as container
    
    const headerContainer = document.createElement('div');
    headerContainer.className = 'flex h-12 bg-gray-800'; // Apply background here
    headerContainer.style.width = `${totalWidth}px`;
    
    for (let d = 0; d < days; d++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + d);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'flex-shrink-0 text-center text-sm font-medium text-gray-300 py-3 border-r border-gray-700';
        dayHeader.style.width = `${totalWidth / days}px`;
        dayHeader.textContent = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        headerContainer.appendChild(dayHeader);
    }
    daysHeader.appendChild(headerContainer);
    
    const grid = document.createElement('div');
    grid.className = 'relative';
    grid.style.height = `${app.hackathonSettings.duration * 80}px`; // Height based on total hours
    grid.style.width = `${totalWidth}px`;
    
    for (let h = 0; h <= app.hackathonSettings.duration; h++) {
        const hourLine = document.createElement('div');
        hourLine.className = 'absolute w-full border-b border-gray-700';
        hourLine.style.top = `${h * 80}px`;
        grid.appendChild(hourLine);
    }
    
    const dayColumns = document.createElement('div');
    dayColumns.className = 'absolute inset-0 flex';
    
    for (let d = 0; d < days; d++) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'border-r border-gray-700';
        dayColumn.style.width = `${totalWidth / days}px`;
        dayColumn.onclick = () => {
            const clickedDate = new Date(startDate);
            clickedDate.setDate(clickedDate.getDate() + d);
            handleCalendarDayClick(clickedDate);
        };
        dayColumns.appendChild(dayColumn);
    }
    grid.appendChild(dayColumns);
    
    app.allTasks.forEach(task => {
        const taskElements = createTaskElements(task, startDate, days, totalWidth);
        taskElements.forEach(el => grid.appendChild(el));
    });
    
    container.appendChild(grid);
    
    if (scrollbarContent) {
        scrollbarContent.style.width = `${totalWidth}px`;
    }
    
    setupSynchronizedScrolling();
}

/**
 * Creates individual task elements to be displayed on the calendar grid.
 * Handles multi-day tasks by creating multiple visual segments.
 * @param {object} task - The task object.
 * @param {Date} calendarStart - The start date of the calendar view.
 * @param {number} totalDays - The total number of days in the calendar view.
 * @param {number} totalWidth - The total pixel width of the calendar grid.
 * @returns {Array<HTMLElement>} An array of task DIV elements.
 */
function createTaskElements(task, calendarStart, totalDays, totalWidth) {
    const elements = [];
    
    const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
    const assignedMembers = assignees.map(id => app.teamMembers.find(m => m.id === id)).filter(m => m);
    
    // Only render tasks that have at least one assigned member (for visual assignment)
    if (assignedMembers.length === 0) return elements;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    // Basic validation for dates
    if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) {
        console.warn('Invalid date for task:', task.title, task.startDate, task.endDate);
        return elements;
    }
    
    const calendarEnd = calculateEndDate(calendarStart, app.hackathonSettings.duration);
    
    // Do not render tasks completely outside the calendar range
    if (taskEnd < calendarStart || taskStart > calendarEnd) return elements;
    
    // Determine the actual start and end for rendering within the calendar bounds
    const effectiveRenderStart = new Date(Math.max(taskStart.getTime(), calendarStart.getTime()));
    const effectiveRenderEnd = new Date(Math.min(taskEnd.getTime(), calendarEnd.getTime()));
    
    // Calculate the start and end day index within the calendar range
    const startDayIndex = Math.floor((effectiveRenderStart.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));
    const endDayIndex = Math.floor((effectiveRenderEnd.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));

    const dayWidth = totalWidth / totalDays;

    for (let day = startDayIndex; day <= endDayIndex && day < totalDays; day++) {
        // Calculate the start and end time for the current day's segment of the task
        const segmentDayStart = new Date(calendarStart);
        segmentDayStart.setDate(segmentDayStart.getDate() + day);
        segmentDayStart.setHours(0, 0, 0, 0); // Start of the current calendar day

        const segmentDayEnd = new Date(segmentDayStart);
        segmentDayEnd.setDate(segmentDayEnd.getDate() + 1); // End of the current calendar day (start of next)

        const currentSegmentStart = new Date(Math.max(effectiveRenderStart.getTime(), segmentDayStart.getTime()));
        const currentSegmentEnd = new Date(Math.min(effectiveRenderEnd.getTime(), segmentDayEnd.getTime()));

        if (currentSegmentStart >= currentSegmentEnd) continue; // Skip if this segment is invalid

        // Calculate position (top) based on hours from calendar start
        const minutesFromHackathonStart = (currentSegmentStart.getTime() - calendarStart.getTime()) / (1000 * 60);
        const topPosition = (minutesFromHackathonStart / 60) * 80; // 80px per hour

        // Calculate height based on segment duration
        const durationMinutes = (currentSegmentEnd.getTime() - currentSegmentStart.getTime()) / (1000 * 60);
        const height = (durationMinutes / 60) * 80;

        const taskEl = document.createElement('div');
        
        // Apply gradient or solid color based on number of assignees
        if (assignedMembers.length > 1) {
            const colors = assignedMembers.map((member, index) => {
                const color = getComputedStyle(document.documentElement).getPropertyValue(`--team-color-${(member.colorIndex % 8) + 1}`);
                return `${color} ${index / assignedMembers.length * 100}%`;
            });
            taskEl.style.background = `linear-gradient(to right, ${colors.join(', ')})`;
        } else {
            taskEl.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(`--team-color-${(assignedMembers[0].colorIndex % 8) + 1}`);
        }
        
        taskEl.className = `absolute rounded px-2 py-1 cursor-pointer hover:shadow-lg transition-shadow text-white text-xs overflow-hidden calendar-task`;
        taskEl.style.top = `${topPosition}px`;
        taskEl.style.height = `${Math.max(20, height - 2)}px`; // Min height to ensure visibility, -2 for padding/border
        taskEl.style.left = `${day * dayWidth + 2}px`; // Position within day column, +2 for left padding
        taskEl.style.width = `${dayWidth - 4}px`; // Width for day column, -4 for total horizontal padding
        taskEl.style.zIndex = '10'; // Ensure tasks are above grid lines

        // Add classes for multi-day task visual cues
        if (day === startDayIndex && day < endDayIndex) {
            taskEl.classList.add('task-multi-day-start');
        } else if (day > startDayIndex && day < endDayIndex) {
            taskEl.classList.add('task-multi-day-middle');
        } else if (day === endDayIndex && day > startDayIndex) {
            taskEl.classList.add('task-multi-day-end');
        }

        // Task content for display
        taskEl.innerHTML = `
            <div class="font-semibold truncate">${task.title}</div>
            <div class="text-xs opacity-90">${assignedMembers.map(m => m.name).join(', ')}</div>
            ${height > 30 ? `<div class="text-xs opacity-75">${formatTime(currentSegmentStart)} - ${formatTime(currentSegmentEnd)}</div>` : ''}
        `;
        
        // Click handler to open task modal
        taskEl.onclick = (e) => {
            e.stopPropagation(); // Prevent click from propagating to day column
            showTaskModal(task.id);
        };
        // Title attribute for hover tooltip
        taskEl.title = `${task.title}\nAssigned: ${assignedMembers.map(m => m.name).join(', ')}\nDuration: ${task.estimatedHours}h\nStatus: ${task.status}\n${formatFullDate(task.startDate)} - ${formatFullDate(task.endDate)}`;
        
        elements.push(taskEl);
    }
    
    return elements;
}

// Format time only (e.g., "14:30")
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Sets up synchronized scrolling behavior between calendar header and main content.
 */
function setupSynchronizedScrolling() {
    const scrollContainer = elements.calendarScrollContainer;
    const daysHeader = elements.calendarDaysHeader;
    const timeColumn = elements.timeColumn;
    const scrollbar = elements.calendarScrollbar;
    
    if (!scrollContainer || !daysHeader || !scrollbar || !timeColumn) return;
    
    let isUpdating = false; // Flag to prevent infinite scroll loops
    
    const syncHorizontalScroll = (source) => {
        if (isUpdating) return;
        isUpdating = true;
        
        const scrollLeft = source.scrollLeft;
        
        // Synchronize all horizontally scrollable elements
        if (source !== scrollContainer) scrollContainer.scrollLeft = scrollLeft;
        if (source !== daysHeader) daysHeader.scrollLeft = scrollLeft;
        if (source !== scrollbar) scrollbar.scrollLeft = scrollLeft;
        
        setTimeout(() => { isUpdating = false; }, 10); // Debounce
    };
    
    const syncVerticalScroll = () => {
        if (isUpdating || !timeColumn) return;
        isUpdating = true;
        
        const scrollTop = scrollContainer.scrollTop;
        // Apply negative translateY to make time column "stick" to the top as content scrolls
        timeColumn.style.transform = `translateY(${-scrollTop}px)`;
        
        setTimeout(() => { isUpdating = false; }, 10); // Debounce
    };
    
    // Add scroll listeners
    scrollContainer.addEventListener('scroll', () => {
        syncHorizontalScroll(scrollContainer);
        syncVerticalScroll();
    });
    
    daysHeader.addEventListener('scroll', () => {
        syncHorizontalScroll(daysHeader);
    });
    
    scrollbar.addEventListener('scroll', () => {
        syncHorizontalScroll(scrollbar);
    });

    // Initial sync on setup
    syncVerticalScroll();
    syncHorizontalScroll(scrollContainer);
}

/**
 * Renders the list of team members for the calendar view's sidebar.
 * This list provides an overview of each member's assigned tasks and hours,
 * and allows clicking to view their detailed tasks in a popup.
 */
function renderTeamMembersSidebar() {
    const membersListContainer = elements.teamMembersCalendarList;
    if (!membersListContainer) return;

    membersListContainer.innerHTML = ''; // Clear previous content
    
    if (app.teamMembers.length === 0) {
        membersListContainer.innerHTML = '<p class="text-gray-500 text-xs text-center">No team members added yet.</p>';
        return;
    }

    app.teamMembers.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'cursor-pointer hover:bg-gray-700 p-3 rounded transition-colors bg-gray-800 shadow-sm';
        memberItem.onclick = () => showMemberTasks(member.id);
        
        const memberTasks = app.allTasks.filter(t => {
            if (Array.isArray(t.assignedTo)) {
                return t.assignedTo.includes(member.id);
            }
            return t.assignedTo === member.id;
        });
        
        const taskCount = memberTasks.length;
        const totalHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
        
        memberItem.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="team-badge team-member-${(member.colorIndex % 8) + 1} text-sm">${member.name}</span>
                <span class="text-xs text-gray-400">${taskCount} tasks</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">${totalHours}h total</div>
        `;
        
        membersListContainer.appendChild(memberItem);
    });
}

/**
 * Shows a popup modal displaying all tasks assigned to a specific team member.
 * @param {string} memberId - The ID of the team member whose tasks to display.
 */
function showMemberTasks(memberId) {
    const member = app.teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    const popup = elements.memberTasksPopup;
    const popupName = document.getElementById('popup-member-name');
    const popupTasks = document.getElementById('popup-member-tasks');
    
    if (!popup || !popupName || !popupTasks) return;
    
    popupName.textContent = member.name;
    popupName.className = `font-semibold mb-2 team-badge team-member-${(member.colorIndex % 8) + 1} text-white px-2 py-1 rounded inline-block`;
    
    const memberTasks = app.allTasks.filter(t => {
        if (Array.isArray(t.assignedTo)) {
            return t.assignedTo.includes(memberId);
        }
        return t.assignedTo === memberId;
    }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime()); // Sort by start date
    
    popupTasks.innerHTML = memberTasks.length > 0 ? memberTasks.map(task => {
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
        const assignedMembers = assignees.map(id => app.teamMembers.find(m => m.id === id)).filter(m => m);
        
        return `
            <div class="p-2 bg-gray-700 rounded border border-gray-600 cursor-pointer hover:shadow-sm"
                 onclick="showTaskModal('${task.id}')">
                <div class="font-medium text-white">${task.title}</div>
                <div class="text-xs text-gray-400">
                    ${formatDate(task.startDate)} - ${formatDate(task.endDate)}
                    (${task.estimatedHours}h)
                </div>
                <div class="text-xs text-gray-500 mt-1">Phase: ${task.phase} | Priority: ${task.priority} | Status: ${task.status}</div>
                ${assignedMembers.length > 1 ? `
                    <div class="text-xs text-gray-500 mt-1">
                        Assigned with: ${assignedMembers.filter(m => m.id !== memberId).map(m => m.name).join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('') : '<p class="text-gray-500">No tasks assigned yet</p>';
    
    popup.classList.remove('hidden');
}

/**
 * Formats a date object into a full date string suitable for display in the calendar date range.
 * @param {Date} date - The date object to format.
 * @returns {string} The formatted date string.
 */
function formatFullDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Update calendar view (placeholder)
function updateCalendarView(view) {
    // Placeholder function
    // Will switch between week/month views
    showMessage('Feature Coming Soon', 'Switching calendar views is a feature currently under development!', 'alert');
}

/**
 * Handles a click on a calendar day to pre-fill the task modal with the clicked date.
 * @param {Date} date - The date clicked on the calendar.
 */
function handleCalendarDayClick(date) {
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0); // Default to 9 AM
    
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0); // Default 1 hour duration
    
    showTaskModal(null); // Open modal for new task
    
    // Set a small timeout to ensure modal elements are rendered before attempting to set their values
    setTimeout(() => {
        document.getElementById('task-start').value = formatDateTimeLocal(startDate);
        document.getElementById('task-end').value = formatDateTimeLocal(endDate);
    }, 100);
}

// ========== Modal Functions ==========

/**
 * Shows the task creation/editing modal.
 * @param {string|null} taskId - The ID of the task to edit, or null to create a new task.
 */
function showTaskModal(taskId = null) {
    const modal = elements.taskModal;
    const isEditing = taskId !== null;
    const task = isEditing ? app.allTasks.find(t => t.id === taskId) : null;
    
    modal.innerHTML = `
        <div class="modal-content bg-gray-800 text-gray-100 rounded-lg p-6 shadow-xl">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold text-blue-300">${isEditing ? 'Edit Task' : 'Create New Task'}</h3>
                <button onclick="hideTaskModal()" class="text-gray-400 hover:text-gray-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <form id="task-form" class="space-y-4">
                <div>
                    <label class="form-label">Task Title</label>
                    <input type="text" id="task-title" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500"
                           value="${task ? task.title : ''}" required>
                </div>
                
                <div>
                    <label class="form-label">Description</label>
                    <textarea id="task-description" class="form-input h-24 bg-gray-700 border-gray-600 focus:border-blue-500"
                              placeholder="Describe the task...">${task ? task.description : ''}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Assigned To</label>
                        <div class="space-y-2 max-h-32 overflow-y-auto custom-scrollbar border border-gray-600 p-2 rounded-md bg-gray-700">
                            ${app.teamMembers.length > 0 ? app.teamMembers.map(member => {
                                const isAssigned = task && (
                                    Array.isArray(task.assignedTo)
                                        ? task.assignedTo.includes(member.id)
                                        : task.assignedTo === member.id
                                );
                                return `
                                    <label class="flex items-center cursor-pointer text-gray-200">
                                        <input type="checkbox"
                                               name="assignee"
                                               value="${member.id}"
                                               ${isAssigned ? 'checked' : ''}
                                               class="mr-2 h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 bg-gray-600">
                                        <span class="team-badge team-member-${(member.colorIndex % 8) + 1} text-xs">
                                            ${member.name}
                                        </span>
                                    </label>
                                `;
                            }).join('') : '<p class="text-gray-500 text-xs">No team members added. Go to Team page to add some!</p>'}
                        </div>
                    </div>
                    
                    <div>
                        <label class="form-label">Priority</label>
                        <select id="task-priority" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500">
                            <option value="low" ${task && task.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${task && task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${task && task.priority === 'high' ? 'selected' : ''}>High</option>
                        </select>
                         <label class="form-label mt-4">Phase</label>
                        <select id="task-phase" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500">
                            <option value="planning" ${task && task.phase === 'planning' ? 'selected' : ''}>Planning</option>
                            <option value="design" ${task && task.phase === 'design' ? 'selected' : ''}>Design</option>
                            <option value="development" ${task && task.phase === 'development' ? 'selected' : ''}>Development</option>
                            <option value="integration" ${task && task.phase === 'integration' ? 'selected' : ''}>Integration</option>
                            <option value="testing" ${task && task.phase === 'testing' ? 'selected' : ''}>Testing</option>
                            <option value="presentation" ${task && task.phase === 'presentation' ? 'selected' : ''}>Presentation</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Start Time</label>
                        <input type="datetime-local" id="task-start" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500"
                               value="${task ? formatDateTimeLocal(task.startDate) : ''}" required>
                    </div>
                    
                    <div>
                        <label class="form-label">End Time</label>
                        <input type="datetime-local" id="task-end" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500"
                               value="${task ? formatDateTimeLocal(task.endDate) : ''}" required>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">Status</label>
                    <select id="task-status" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500">
                        <option value="Not Started" ${task && task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                        <option value="In Progress" ${task && task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${task && task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Blocked" ${task && task.status === 'Blocked' ? 'selected' : ''}>Blocked</option>
                    </select>
                </div>
                
                <div>
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" id="task-estimated-hours" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500" min="0.5" step="0.5"
                           value="${task ? task.estimatedHours : 1}" required>
                </div>

                <div class="flex justify-between pt-4">
                    <div>
                        ${isEditing ? `
                            <button type="button" onclick="deleteTask('${taskId}')"
                                    class="text-red-400 hover:text-red-500">
                                Delete Task
                            </button>
                        ` : ''}
                    </div>
                    <div class="space-x-3">
                        <button type="button" onclick="hideTaskModal()"
                                class="btn bg-gray-600 hover:bg-gray-700">
                            Cancel
                        </button>
                        <button type="submit" class="btn">
                            ${isEditing ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const assigneeCheckboxes = document.querySelectorAll('input[name="assignee"]:checked');
        const assignedTo = Array.from(assigneeCheckboxes).map(cb => cb.value);
        
        const formData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignedTo: assignedTo,
            priority: document.getElementById('task-priority').value,
            startDate: new Date(document.getElementById('task-start').value),
            endDate: new Date(document.getElementById('task-end').value),
            status: document.getElementById('task-status').value,
            estimatedHours: parseFloat(document.getElementById('task-estimated-hours').value),
            phase: document.getElementById('task-phase').value
        };
        
        // Basic validation for dates
        if (formData.startDate.getTime() >= formData.endDate.getTime()) {
            showMessage('Date Error', 'End Time must be after Start Time.', 'alert');
            return;
        }

        if (isEditing) {
            updateTask(taskId, formData);
            showMessage('Task Updated', 'Task details updated successfully.', 'alert');
        } else {
            createTask(formData);
            showMessage('Task Created', 'New task created successfully.', 'alert');
        }
        
        hideTaskModal();
        
        // Re-render relevant parts of the UI after task creation/update
        if (app.currentPage === 'calendar') {
            renderCalendar();
        }
        updateTeamStats();
        // Also update dashboard tasks if visible
        if (app.currentPage === 'dashboard' && app.allTasks.length > 0) {
            displayGeneratedTasks(app.allTasks);
        }
    });
}

/**
 * Hides the task modal.
 */
function hideTaskModal() {
    elements.taskModal.classList.add('hidden');
}

/**
 * Formats a Date object into a string suitable for `datetime-local` input.
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted datetime string (YYYY-MM-DDTHH:MM).
 */
function formatDateTimeLocal(date) {
    if (!date || isNaN(date.getTime())) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ========== Utility Functions ==========

/**
 * Generates a unique ID using a combination of timestamp and random characters.
 * @returns {string} A unique ID string.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Formats a Date object into a readable short date and time string.
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date and time string.
 */
function formatDate(date) {
    if (!date || isNaN(date.getTime())) return '';
    const d = new Date(date);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${hours}:${minutes}`;
}

/**
 * Adds a specified number of hours to a given date.
 * @param {Date} date - The starting date.
 * @param {number} hours - The number of hours to add.
 * @returns {Date} The new Date object.
 */
function addHours(date, hours) {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
}

/**
 * Calculates the end date based on a start date and duration in hours.
 * @param {Date} startDate - The starting date.
 * @param {number} durationHours - The duration in hours.
 * @returns {Date} The calculated end date.
 */
function calculateEndDate(startDate, durationHours) {
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + durationHours);
    return endDate;
}

/**
 * Validates if hackathon settings (start date and duration) are configured.
 * @returns {boolean} True if settings are valid, false otherwise.
 */
function validateHackathonSettings() {
    if (!app.hackathonSettings.startDate || !app.hackathonSettings.duration || isNaN(app.hackathonSettings.startDate.getTime()) || app.hackathonSettings.duration <= 0) {
        return false;
    }
    return true;
}

/**
 * Gets the CSS class for a team member's color badge.
 * @param {number} memberIndex - The color index of the team member.
 * @returns {string} The CSS class name.
 */
function getTeamMemberColor(memberIndex) {
    return `team-member-${(memberIndex % 8) + 1}`;
}

// ========== Local Storage Functions ==========

/**
 * Saves the current application state to local storage.
 */
function saveToLocalStorage() {
    const dataToSave = {
        hackathonSettings: app.hackathonSettings,
        teamMembers: app.teamMembers,
        allTasks: app.allTasks,
        projectIdea: app.projectIdea,
        chatHistory: app.chatHistory
    };
    
    localStorage.setItem('hackmanagerData', JSON.stringify(dataToSave));
}

/**
 * Loads saved application state from local storage.
 * Converts date strings back to Date objects.
 */
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('hackmanagerData');
    
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            
            if (parsed.hackathonSettings) {
                app.hackathonSettings = parsed.hackathonSettings;
                if (app.hackathonSettings.startDate) {
                    app.hackathonSettings.startDate = new Date(parsed.hackathonSettings.startDate);
                }
            }
            
            if (parsed.teamMembers) {
                app.teamMembers = parsed.teamMembers;
            }
            
            if (parsed.allTasks) {
                app.allTasks = parsed.allTasks;
                app.allTasks.forEach(task => {
                    if (task.startDate) task.startDate = new Date(task.startDate);
                    if (task.endDate) task.endDate = new Date(task.endDate);
                    
                    if (!Array.isArray(task.assignedTo)) {
                        task.assignedTo = task.assignedTo ? [task.assignedTo] : [];
                    }
                });
            }
            
            if (parsed.projectIdea) {
                app.projectIdea = parsed.projectIdea;
            }
            
            if (parsed.chatHistory && parsed.chatHistory.general) {
                app.chatHistory.general = parsed.chatHistory.general;
            } else {
                app.chatHistory.general = []; // Initialize if not present
            }
            
        } catch (error) {
            console.error('Error loading data from local storage:', error);
            // If data is corrupted, consider clearing it to prevent app issues
            // localStorage.clear();
        }
    }
}

/**
 * Clears all stored application data from local storage and redirects to onboarding.
 * Uses a custom confirm modal instead of browser's `confirm`.
 */
function clearLocalStorage() {
    showMessage('Confirm Clear All Data', 'Are you sure you want to clear ALL data and reset the application? This action cannot be undone.', 'confirm', () => {
        // Clear all stored data
        localStorage.clear(); // Clears all items from localStorage

        // Redirect to the first onboarding page
        window.location.href = 'index.html'; 
    });
}
