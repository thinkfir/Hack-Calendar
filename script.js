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

    // Handle dashboard-specific overflow behavior
    const mainElement = document.querySelector('main');
    if (pageId === 'dashboard') {
        mainElement.classList.add('dashboard-active');
    } else {
        mainElement.classList.remove('dashboard-active');
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

    // Calendar scroll synchronization
    if (elements.calendarScrollContainer && elements.timeColumn) {
        elements.calendarScrollContainer.addEventListener('scroll', () => {
            elements.timeColumn.scrollTop = elements.calendarScrollContainer.scrollTop;
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
    let labelText = 'AI Model'; // Default value

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
                models = ['gemini-2.5-flash', 'gemini-2.5-pro']; // gemini-2.5-flash is recommended
                labelText = 'Google Model';
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
    newMember;
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

        const hackathonStart = app.hackathonSettings.startDate ? new Date(app.hackathonSettings.startDate) : null;
        const hackathonEnd = hackathonStart && app.hackathonSettings.duration ? calculateEndDate(hackathonStart, app.hackathonSettings.duration) : null;
        const timeframeInfo = hackathonStart && hackathonEnd ? 
            `Hackathon Timeframe: ${hackathonStart.toISOString()} to ${hackathonEnd.toISOString()} (${app.hackathonSettings.duration} hours total)` : 
            'No hackathon timeframe configured';

        const prompt = `You are a hackathon project manager AI. Based on the current project idea "${projectIdeaContext}", and the user's request, provide helpful advice or perform requested actions.
        
        ${timeframeInfo}
        Current Team Members: ${app.teamMembers.map(m => m.name).join(', ') || 'None'}
        Current Tasks: ${app.allTasks.map(t => `${t.title} (Status: ${t.status}, Assigned: ${t.assignedTo.map(id => app.teamMembers.find(tm => tm.id === id)?.name || 'Unknown').join(', ')})`).join('; ') || 'None'}
        
        User Request: "${userMessage}"
        
        IMPORTANT: When creating new tasks, ensure ALL task start and end dates fall within the hackathon timeframe (${hackathonStart ? hackathonStart.toISOString() : 'NOT SET'} to ${hackathonEnd ? hackathonEnd.toISOString() : 'NOT SET'}). Do not create tasks that extend beyond the hackathon duration.
        
        The 'startTime' and 'endTime' fields are MANDATORY for every task.

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
                    "status": "Not Started|In Progress|Completed|Blocked",
                    "startDate": "ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ) - must be within hackathon timeframe",
                    "endDate": "ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ) - must be within hackathon timeframe"
                }
            ]
        }
        
        If no task modification is requested, provide a conversational response.`;
        
        // Use the general call to Gemini API, now with structured output schema for Gemini.
        const taskSchema = {
            type: "OBJECT",
            properties: {
                action: { type: "STRING", enum: ["update_tasks"] },
                tasks: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            id: { type: "STRING" },
                            title: { type: "STRING" },
                            description: { type: "STRING" },
                            phase: { type: "STRING", enum: ["planning", "design", "development", "integration", "testing", "presentation"] },
                            estimatedHours: { type: "NUMBER" },
                            priority: { type: "STRING", enum: ["high", "medium", "low"] },
                            assignedTo: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            status: { type: "STRING", enum: ["Not Started", "In Progress", "Completed", "Blocked"] },
                            startDate: { type: "STRING" },
                            endDate: { type: "STRING" }
                        },
                        required: ["id", "title", "description", "phase", "estimatedHours", "priority", "assignedTo", "status", "startDate", "endDate"],
                        propertyOrdering: [
                            "id", "title", "description", "phase", "estimatedHours", "priority", "assignedTo", "status", "startDate", "endDate"
                        ]
                    }
                }
            },
            required: ["action", "tasks"],
            propertyOrdering: ["action", "tasks"]
        };
        const responseText = await callGeminiAPI(prompt, selectedProvider, taskSchema);

        let aiContent = responseText;
        let actionHandled = false;

        try {
            const tasksFromAI = Array.isArray(responseText) ? responseText : (responseText.tasks || []);

            if (tasksFromAI.length > 0) {
                // Standardize the data right here, at the source.
                const standardizedTasks = tasksFromAI.map(aiTask => {
                    const assignedToIds = Array.isArray(aiTask.assignedTo)
                        ? aiTask.assignedTo.map(name => {
                            const member = app.teamMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
                            return member ? member.id : null;
                        }).filter(id => id !== null)
                        : [];

                    return {
                        id: aiTask.id, // Keep original ID if provided
                        name: aiTask.title, // Standardize to 'name'
                        description: aiTask.description,
                        startTime: aiTask.startDate, // Standardize to 'startTime'
                        endTime: aiTask.endDate,   // Standardize to 'endTime'
                        assignedTo: assignedToIds,
                        status: aiTask.status,
                        priority: aiTask.priority,
                        estimatedHours: aiTask.estimatedHours,
                        phase: aiTask.phase,
                        dependencies: aiTask.dependencies
                    };
                });

                // Now, process the clean, standardized tasks
                standardizedTasks.forEach(taskData => {
                    const existingTask = app.allTasks.find(t => t.id === taskData.id);
                    if (existingTask) {
                        updateTask(taskData.id, taskData);
                    } else {
                        createTask(taskData);
                    }
                });

                aiContent = `AI has updated the task list.`;
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
    const selectedModel = localStorage.getItem(`${provider}_model`);
    let apiUrl;
    let payload;
    let headers = { 'Content-Type': 'application/json' };

    // For chat, we need to format the history correctly
    const history = app.chatHistory.general.slice(0, -1).map(msg => {
        // Gemini expects 'parts' to be an array of {text: "..."} objects
        return {
            role: msg.role,
            parts: [{ text: msg.content }]
        };
    });

    switch (provider) {
        case 'google':
        case 'groq': // Reroute groq to use the gemini endpoint as well
            // Use appropriate URL based on environment
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                apiUrl = '/gemini'; // Local development
            } else {
                apiUrl = '/.netlify/functions/gemini'; // Netlify functions
            }
            payload = {
                history: history,
                prompt: prompt,
                temperature: 0.7,
                max_tokens: 4000
            };
            // Add structured output config if outputSchema is provided
            if (outputSchema) {
                payload.responseMimeType = "application/json";
                payload.responseSchema = outputSchema;
            }
            break;
        // Keep other providers as they are, assuming they might be used.
        // Note: The logic below for other providers might need adjustment if they also need history.
        case 'openai':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${localStorage.getItem('openai_api_key')}`;
            payload = {
                model: selectedModel,
                messages: history.map(h => ({role: h.role, content: h.parts[0].text})).concat([{ role: 'user', content: prompt }]),
                temperature: 0.7,
                max_tokens: 4000,
                response_format: outputSchema ? { type: "json_object" } : undefined
            };
            break;
        // ... other cases would need similar history formatting
        default:
            throw new Error('Invalid AI provider selected or not yet configured for chat history.');
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.details || errorData.error || JSON.stringify(errorData);
            throw new Error(`API request failed: ${errorMessage}`);
        }

        const data = await response.json();
        
        let aiResponseContent;
        
        // Try to extract content from the response - handle both Gemini and other formats
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            // Gemini API format
            aiResponseContent = data.candidates[0].content.parts[0].text;
        } else if (data.choices && data.choices[0] && data.choices[0].message) {
            // OpenAI/alternative format
            aiResponseContent = data.choices[0].message.content;
        } else {
            console.error('Unexpected API response structure:', data);
            throw new Error('Unexpected API response structure. Please check the console for details.');
        }
        
        if (!aiResponseContent) {
            throw new Error('No content received from AI API');
        }

        if (outputSchema) {
            try {
                return JSON.parse(aiResponseContent);
            } catch (parseError) {
                console.error('Failed to parse AI response as JSON:', aiResponseContent, parseError);
                throw new Error('AI response was not valid JSON for the requested schema.');
            }
        }
        return aiResponseContent;

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

    // Ensure content is a string
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    // Only push if it's not a temporary loading message
    if (contentStr.indexOf('Thinking and generating tasks...') === -1 && contentStr.indexOf('AI is thinking...') === -1 && contentStr.indexOf('AI is windin\' up!') === -1) {
        // Prevent duplicate messages if already in history (e.g., from loading)
        const lastMsg = app.chatHistory.general[app.chatHistory.general.length - 1];
        if (!lastMsg || !(lastMsg.role === role && lastMsg.content === contentStr)) {
            app.chatHistory.general.push({ role, content: contentStr });
        }
    }


    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg mb-2 ${role === 'user' ? 'bg-blue-700 self-end text-right ml-auto text-white' : 'bg-gray-700 self-start text-left mr-auto text-gray-100'}`;
    messageDiv.style.maxWidth = '80%';
    messageDiv.dataset.role = role; // Custom attribute to easily identify AI messages

    messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'AI'}:</strong> ${contentStr}`;
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
                        <strong class="text-white">${task.name}</strong>
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
                        <span class="text-xs text-gray-400">${formatDate(task.startTime)} - ${formatDate(task.endTime)}</span>
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


/**
 * Creates a new task and adds it to the application state.
 * @param {object} taskData - Object containing task details.
 * @returns {object} The newly created task object.
 */
function createTask(taskData) {
    // This function now expects standardized data.
    // It provides a safe fallback for dates if they are missing from the AI response.
    const hackathonStartDate = app.hackathonSettings.startDate || new Date();
    const startTime = taskData.startTime ? new Date(taskData.startTime) : hackathonStartDate;
    // If endTime is missing, default it to 1 hour after the startTime.
    const endTime = taskData.endTime ? new Date(taskData.endTime) : new Date(startTime.getTime() + 60 * 60 * 1000);

    const task = {
        id: taskData.id || generateId(),
        name: taskData.name || 'New Task',
        description: taskData.description || '',
        startTime: startTime,
        endTime: endTime,
        assignedTo: taskData.assignedTo || [],
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
        // This function now expects standardized data in the 'updates' object.
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
    
    // Show 24 hours of the day (0-23) instead of absolute hackathon hours
    const totalHours = 24;
    
    // Ensure the time column height matches the grid height for synchronized scrolling
    timeColumn.style.height = `${totalHours * 50}px`;
    
    for (let hour = 0; hour < totalHours; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'absolute w-full text-xs text-gray-400 px-2';
        timeSlot.style.top = `${hour * 50}px`; // Position each hour marker
        timeSlot.textContent = hour.toString().padStart(2, '0') + ':00';
        
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
    
    // Calculate the number of calendar days needed to display the full hackathon
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0); // Start of first day
    
    const endDay = new Date(endDate);
    endDay.setHours(23, 59, 59, 999); // End of last day
    
    const days = Math.ceil((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`=== CALENDAR RANGE ===`);
    console.log(`Hackathon: ${startDate} to ${endDate}`);
    console.log(`Calendar days: ${days} (from ${startDay} to ${endDay})`);
    
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
        dayHeader.style.width = `${180 - 4}px`; // Match column width (dayWidth - 4)
        dayHeader.style.marginLeft = '2px';
        dayHeader.style.marginRight = '2px';
        dayHeader.textContent = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        headerContainer.appendChild(dayHeader);
    }
    daysHeader.appendChild(headerContainer);
    
    const grid = document.createElement('div');
    grid.className = 'relative';
    grid.style.height = `${24 * 50}px`; // Set explicit height for 24 hours
    grid.style.width = '100%'; // Remove fixed width to prevent horizontal scroll
    
    // Create horizontal lines for 24 hours (0-23)
    for (let h = 0; h < 24; h++) {
        const hourLine = document.createElement('div');
        hourLine.className = 'absolute w-full border-b border-gray-700';
        hourLine.style.top = `${h * 50}px`;
        grid.appendChild(hourLine);
    }
    
    const dayColumns = document.createElement('div');
    dayColumns.className = 'absolute inset-0 flex';
    
    for (let d = 0; d < days; d++) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'border-r border-gray-700';
        dayColumn.style.width = `${180 - 4}px`; // Match task width (dayWidth - 4)
        dayColumn.style.marginLeft = '2px'; // Align with task left padding
        dayColumn.style.marginRight = '2px'; // Align with task right padding
        dayColumn.onclick = () => {
            const clickedDate = new Date(startDate);
            clickedDate.setDate(clickedDate.getDate() + d);
            handleCalendarDayClick(clickedDate);
        };
        dayColumns.appendChild(dayColumn);
    }
    grid.appendChild(dayColumns);
    
    // Calculate task overlaps and create elements with proper positioning
    const taskElementsWithOverlap = createTaskElementsWithOverlapHandling(app.allTasks, startDate, days, totalWidth);
    console.log(`=== APPENDING ELEMENTS TO DOM ===`);
    console.log(`About to append ${taskElementsWithOverlap.length} elements to calendar grid`);
    
    taskElementsWithOverlap.forEach((el, index) => {
        console.log(`Appending element ${index + 1}:`, el);
        grid.appendChild(el);
    });
    
    console.log(`=== DOM APPEND COMPLETE ===`);
    
    container.appendChild(grid);
    
    if (scrollbarContent) {
        scrollbarContent.style.width = '100%'; // Remove fixed width for scrollbar content
    }
    
    
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
    
    // Continue processing both assigned and unassigned tasks

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

    const dayWidth = 180; // Match the fixed dayWidth in renderCalendarGrid

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

        // Calculate position (top) based on time of day, not absolute time from hackathon start
        const hourOfDay = currentSegmentStart.getHours() + (currentSegmentStart.getMinutes() / 60);
        const topPosition = hourOfDay * 50; // 50px per hour

        // Calculate height based on segment duration
        const durationMinutes = (currentSegmentEnd.getTime() - currentSegmentStart.getTime()) / (1000 * 60);
        const height = (durationMinutes / 60) * 50;

        const taskEl = document.createElement('div');
        
        // Apply gradient or solid color based on number of assignees
        if (assignedMembers.length === 0) {
            // Unassigned task - use neutral color
            taskEl.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--team-color-unassigned');
        } else if (assignedMembers.length > 1) {
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
        const memberNames = assignedMembers.length > 0 
            ? assignedMembers.map(m => m.name).join(', ')
            : 'Unassigned';
        
        taskEl.innerHTML = `
            <div class="font-semibold truncate">${task.title}</div>
            <div class="text-xs opacity-90">${memberNames}</div>
            ${height > 30 ? `<div class="text-xs opacity-75">${formatTime(currentSegmentStart)} - ${formatTime(currentSegmentEnd)}</div>` : ''}
        `;
        
        // Click handler to open task modal
        taskEl.onclick = (e) => {
            e.stopPropagation(); // Prevent click from propagating to day column
            showTaskModal(task.id);
        };
        // Title attribute for hover tooltip
        const assignedText = assignedMembers.length > 0 
            ? assignedMembers.map(m => m.name).join(', ')
            : 'Unassigned';
        taskEl.title = `${task.title}\nAssigned: ${assignedText}\nDuration: ${task.estimatedHours}h\nStatus: ${task.status}\n${formatFullDate(task.startDate)} - ${formatFullDate(task.endDate)}`;
        
        elements.push(taskEl);
    }
    
    return elements;
}

/**
 * Creates task elements with overlap detection and horizontal width splitting.
 * When tasks overlap in the same time slot, their widths are split to show all tasks.
 * @param {Array<object>} tasks - Array of all tasks.
 * @param {Date} calendarStart - The start date of the calendar view.
 * @param {number} totalDays - The total number of days in the calendar view.
 * @param {number} totalWidth - The total pixel width of the calendar grid.
 * @returns {Array<HTMLElement>} An array of task DIV elements with overlap handling.
 */
function createTaskElementsWithOverlapHandling(tasks, calendarStart, totalDays, totalWidth) {
    console.log("=== TASK ELEMENT CREATION ===");
    console.log("Creating elements for", tasks.length, "tasks");
    
    const elements = [];
    const dayWidth = 180;
    
    // Group tasks by day and time slot to detect overlaps
    const tasksByDaySlot = new Map(); // Key: "dayIndex_timeSlot", Value: array of tasks
    
    // First pass: categorize all tasks by their day and time slots
    tasks.forEach((task, index) => {
        console.log(`Processing task ${index + 1}/${tasks.length}: "${task.name}"`);
        
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
        const assignedMembers = assignees.map(id => app.teamMembers.find(m => m.id === id)).filter(m => m);
        
        // Continue processing both assigned and unassigned tasks

        const taskStart = new Date(task.startTime);
        const taskEnd = new Date(task.endTime);

        // Basic validation for dates
        if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) {
            console.warn('SKIPPING - Invalid date for task:', task.name, task.startTime, task.endTime);
            return;
        }
        
        console.log(`Task dates valid: ${taskStart} to ${taskEnd}`);
        
        const calendarEnd = calculateEndDate(calendarStart, app.hackathonSettings.duration);
        
        // Skip tasks completely outside the calendar range
        if (taskEnd < calendarStart || taskStart > calendarEnd) {
            console.log(`SKIPPING task "${task.name}" - outside calendar range`);
            return;
        }
        
        // Determine the actual start and end for rendering within the calendar bounds
        const effectiveRenderStart = new Date(Math.max(taskStart.getTime(), calendarStart.getTime()));
        const effectiveRenderEnd = new Date(Math.min(taskEnd.getTime(), calendarEnd.getTime()));
        
        // Calculate the start and end day index within the calendar range
        // Use proper day boundaries (start of day) for accurate calculations
        const calendarDayStart = new Date(calendarStart);
        calendarDayStart.setHours(0, 0, 0, 0);
        
        const taskStartDay = new Date(effectiveRenderStart);
        taskStartDay.setHours(0, 0, 0, 0);
        
        const taskEndDay = new Date(effectiveRenderEnd);
        taskEndDay.setHours(0, 0, 0, 0);
        
        const startDayIndex = Math.floor((taskStartDay.getTime() - calendarDayStart.getTime()) / (1000 * 60 * 60 * 24));
        const endDayIndex = Math.floor((taskEndDay.getTime() - calendarDayStart.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`Task "${task.name}": startDayIndex=${startDayIndex}, endDayIndex=${endDayIndex}, totalDays=${totalDays}`);
        
        for (let day = startDayIndex; day <= endDayIndex && day < totalDays; day++) {
            console.log(`  Processing day ${day} for task "${task.name}"`);
            
            // Calculate the start and end time for the current day's segment of the task
            const segmentDayStart = new Date(calendarStart);
            segmentDayStart.setDate(segmentDayStart.getDate() + day);
            segmentDayStart.setHours(0, 0, 0, 0); // Start of the current calendar day

            const segmentDayEnd = new Date(segmentDayStart);
            segmentDayEnd.setDate(segmentDayEnd.getDate() + 1); // End of the current calendar day (start of next)

            const currentSegmentStart = new Date(Math.max(effectiveRenderStart.getTime(), segmentDayStart.getTime()));
            const currentSegmentEnd = new Date(Math.min(effectiveRenderEnd.getTime(), segmentDayEnd.getTime()));

            if (currentSegmentStart >= currentSegmentEnd) continue; // Skip if this segment is invalid

            // Calculate time slot (rounded to 30-minute intervals for overlap detection)
            const startHour = currentSegmentStart.getHours();
            const startMinute = Math.floor(currentSegmentStart.getMinutes() / 30) * 30;
            const endHour = currentSegmentEnd.getHours();
            const endMinute = Math.ceil(currentSegmentEnd.getMinutes() / 30) * 30;
            
            // Create time slots this task occupies
            const startSlot = startHour * 2 + (startMinute / 30);
            const endSlot = endHour * 2 + (endMinute / 30);
            
            for (let slot = startSlot; slot < endSlot; slot++) {
                const slotKey = `${day}_${slot}`;
                if (!tasksByDaySlot.has(slotKey)) {
                    tasksByDaySlot.set(slotKey, []);
                }
                
                // Store task with its segment info
                tasksByDaySlot.get(slotKey).push({
                    task,
                    day,
                    currentSegmentStart,
                    currentSegmentEnd,
                    assignedMembers
                });
            }
        }
    });
    
    // Second pass: create task elements with overlap positioning
    const processedTasks = new Set(); // Track processed task segments to avoid duplicates
    
    console.log(`=== PROCESSING GROUPED TASKS ===`);
    console.log(`Total day/time slots with tasks: ${tasksByDaySlot.size}`);
    
    tasksByDaySlot.forEach((tasksInSlot, slotKey) => {
        const [dayIndex, timeSlot] = slotKey.split('_').map(Number);
        const overlapCount = tasksInSlot.length;
        console.log(`Processing slot ${slotKey} with ${tasksInSlot.length} tasks:`, tasksInSlot.map(t => t.task.name));
        
        tasksInSlot.forEach((taskInfo, index) => {
            const { task, day, currentSegmentStart, currentSegmentEnd, assignedMembers } = taskInfo;
            
            // Create unique key for this task segment
            const segmentKey = `${task.id}_${day}_${currentSegmentStart.getTime()}_${currentSegmentEnd.getTime()}`;
            if (processedTasks.has(segmentKey)) {
                console.log(`SKIPPING duplicate segment for task "${task.name}"`);
                return;
            }
            processedTasks.add(segmentKey);
            console.log(`CREATING DOM ELEMENT for task "${task.name}" at day ${day}`);
            
            // Calculate position based on time of day
            const hourOfDay = currentSegmentStart.getHours() + (currentSegmentStart.getMinutes() / 60);
            const topPosition = hourOfDay * 50;

            // Calculate height based on segment duration
            const durationMinutes = (currentSegmentEnd.getTime() - currentSegmentStart.getTime()) / (1000 * 60);
            const height = (durationMinutes / 60) * 50;

            const taskEl = document.createElement('div');
            
            // Apply gradient or solid color based on number of assignees
            if (assignedMembers.length === 0) {
                // Unassigned task - use neutral color
                taskEl.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--team-color-unassigned');
            } else if (assignedMembers.length > 1) {
                const colors = assignedMembers.map((member, idx) => {
                    const color = getComputedStyle(document.documentElement).getPropertyValue(`--team-color-${(member.colorIndex % 8) + 1}`);
                    return `${color} ${idx / assignedMembers.length * 100}%`;
                });
                taskEl.style.background = `linear-gradient(to right, ${colors.join(', ')})`;
            } else {
                taskEl.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(`--team-color-${(assignedMembers[0].colorIndex % 8) + 1}`);
            }
            
            taskEl.className = `absolute rounded px-2 py-1 cursor-pointer hover:shadow-lg transition-shadow text-white text-xs overflow-hidden calendar-task${overlapCount > 1 ? ' overlapping' : ''}`;
            taskEl.style.top = `${topPosition}px`;
            taskEl.style.height = `${Math.max(20, height - 2)}px`;
            
            // Calculate width and left position based on overlap
            const baseWidth = dayWidth - 4; // Base width minus padding
            const taskWidth = baseWidth / overlapCount;
            const leftOffset = index * taskWidth;
            
            taskEl.style.left = `${day * dayWidth + 2 + leftOffset}px`;
            taskEl.style.width = `${taskWidth - 1}px`; // -1 for slight gap between overlapping tasks
            taskEl.style.zIndex = `${10 + index}`; // Ensure proper stacking order

            // Add classes for multi-day task visual cues
            const startDayIndex = Math.floor((new Date(task.startDate).getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));
            const endDayIndex = Math.floor((new Date(task.endDate).getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));
            
            if (day === startDayIndex && day < endDayIndex) {
                taskEl.classList.add('task-multi-day-start');
            } else if (day > startDayIndex && day < endDayIndex) {
                taskEl.classList.add('task-multi-day-middle');
            } else if (day === endDayIndex && day > startDayIndex) {
                taskEl.classList.add('task-multi-day-end');
            }

            // Task content - adjust based on available width
            const showDetails = taskWidth > 60; // Only show details if there's enough space
            const memberNames = assignedMembers.length > 0 
                ? assignedMembers.map(m => m.name).join(', ')
                : 'Unassigned';
            
            taskEl.innerHTML = `
                <div class="font-semibold truncate" style="font-size: ${taskWidth < 80 ? '10px' : '12px'}">${task.name}</div>
                ${showDetails ? `
                    <div class="text-xs opacity-90 truncate">${memberNames}</div>
                    ${height > 30 ? `<div class="text-xs opacity-75">${formatTime(currentSegmentStart)} - ${formatTime(currentSegmentEnd)}</div>` : ''}
                ` : ''}
            `;
            
            // Click handler to open task modal
            taskEl.onclick = (e) => {
                e.stopPropagation();
                showTaskModal(task.id);
            };
            
            // Enhanced tooltip for overlapping tasks
            const overlapInfo = overlapCount > 1 ? `\n(${overlapCount} tasks overlap at this time)` : '';
            const assignedText = assignedMembers.length > 0 
                ? assignedMembers.map(m => m.name).join(', ')
                : 'Unassigned';
            taskEl.title = `${task.name}\nAssigned: ${assignedText}\nDuration: ${task.estimatedHours}h\nStatus: ${task.status}\n${formatFullDate(task.startTime)} - ${formatFullDate(task.endTime)}${overlapInfo}`;
            
            elements.push(taskEl);
        });
    });
    
    return elements;
}

// Format time only (e.g., "14:30")
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
    }).sort((a, b) => {
        const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return timeA - timeB;
    });
    
    popupTasks.innerHTML = memberTasks.length > 0 ? memberTasks.map(task => {
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
        const assignedMembers = assignees.map(id => app.teamMembers.find(m => m.id === id)).filter(m => m);
        
        const startTimeStr = task.startTime ? formatDate(new Date(task.startTime)) : 'No start date';
        const endTimeStr = task.endTime ? formatDate(new Date(task.endTime)) : 'No end date';

        return `
            <div class="p-2 bg-gray-700 rounded border border-gray-600 cursor-pointer hover:shadow-sm"
                 onclick="showTaskModal('${task.id}')">
                <div class="font-medium text-white">${task.name || task.title}</div>
                <div class="text-xs text-gray-400">
                    ${startTimeStr} - ${endTimeStr}
                </div>
                <div class="text-xs text-gray-500 mt-1">Status: ${task.status}</div>
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
                app.allTasks = parsed.allTasks.map(task => {
                    // Migrate old property names and ensure dates are Date objects
                    const newTask = { ...task };
                    if (newTask.title) {
                        newTask.name = newTask.title;
                        delete newTask.title;
                    }
                    if (newTask.startDate) {
                        newTask.startTime = new Date(newTask.startDate);
                        delete newTask.startDate;
                    }
                    if (newTask.endDate) {
                        newTask.endTime = new Date(newTask.endDate);
                        delete newTask.endDate;
                    }
                    // Handle cases where new properties are stored as strings
                    if (newTask.startTime && !(newTask.startTime instanceof Date)) {
                        newTask.startTime = new Date(newTask.startTime);
                    }
                    if (newTask.endTime && !(newTask.endTime instanceof Date)) {
                        newTask.endTime = new Date(newTask.endTime);
                    }
                    // Ensure assignedTo is an array
                    if (!Array.isArray(newTask.assignedTo)) {
                        newTask.assignedTo = newTask.assignedTo ? [newTask.assignedTo] : [];
                    }
                    return newTask;
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
