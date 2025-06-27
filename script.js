// Global application state
const app = {
    currentPage: 'ai-assistant',
    hackathonSettings: {
        name: '',
        startDate: null,
        duration: null // in hours
    },
    teamMembers: [],
    allTasks: [],
    calendarData: {
        days: [],
        currentView: 'week'
    },
    projectIdea: '',
    selectedMemberId: null, // For tracking which team member is selected in the team page
    chatHistory: [] // To store chat messages for the AI assistant
};

// Element references (cached for performance)
const elements = {};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Cache common DOM elements
    elements.pages = document.querySelectorAll('.page');
    elements.navLinks = document.querySelectorAll('.nav-link');
    elements.onboardingModal = document.getElementById('onboarding-modal');
    elements.onboardingContent = document.getElementById('onboarding-content');
    elements.taskModal = document.getElementById('task-modal');
    elements.projectIdeaInput = document.getElementById('project-idea-input');
    elements.aiResponse = document.getElementById('ai-response');
    elements.chatInput = document.getElementById('chat-input');
    elements.chatForm = document.getElementById('chat-form');
    elements.chatHistory = document.getElementById('chat-history');
    elements.tasksList = document.getElementById('tasks-list'); // For the AI Assistant page's generated tasks display
    
    // Settings page elements
    elements.hackathonName = document.getElementById('hackathon-name');
    elements.startDate = document.getElementById('start-date');
    elements.duration = document.getElementById('duration');
    elements.settingsForm = document.getElementById('settings-form');
    elements.exportDataBtn = document.getElementById('export-data-btn');
    elements.importDataInput = document.getElementById('import-data-input');
    elements.clearDataBtn = document.getElementById('clear-data-btn');

    // Team page elements
    elements.teamMembersSimpleList = document.getElementById('team-members-simple-list');
    elements.addMemberBtn = document.getElementById('add-member-btn');
    elements.memberDetails = document.getElementById('member-details');
    elements.teamStats = document.getElementById('team-stats');

    // Calendar page elements
    elements.calendarContainer = document.getElementById('calendar-container');
    
    // Custom message modal elements
    elements.customMessageModal = document.getElementById('custom-message-modal');
    elements.customMessageTitle = document.getElementById('custom-message-title');
    elements.customMessageBody = document.getElementById('custom-message-body');
    elements.customMessageConfirmBtn = document.getElementById('custom-message-confirm-btn');
    elements.customMessageCancelBtn = document.getElementById('custom-message-cancel-btn');
    elements.customMessageOkBtn = document.getElementById('custom-message-ok-btn');

    loadFromLocalStorage(); // Load saved data
    initializeUI(); // Set up initial UI state
    setupEventListeners(); // Attach all event listeners
    showOnboarding(); // Show onboarding if first time user
    updateTeamStats(); // Initial update of team stats
});

// ========== UI & Navigation Functions ==========

/**
 * Shows a specific page in the application.
 * Hides all other pages and activates the corresponding navigation link.
 * @param {string} pageId - The ID of the page to show (e.g., 'ai-assistant', 'calendar').
 */
function showPage(pageId) {
    app.currentPage = pageId;
    elements.pages.forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(`${pageId}-page`).classList.remove('hidden');

    elements.navLinks.forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.nav-link[data-page="${pageId}"]`).classList.add('active');

    // Perform page-specific rendering
    if (pageId === 'calendar') {
        initializeCalendar();
        renderCalendar();
    } else if (pageId === 'team') {
        renderTeamMembers();
    } else if (pageId === 'ai-assistant') {
        displayChatHistory();
        // displayGeneratedTasks(app.allTasks); // Re-render tasks if any
    }
    saveToLocalStorage(); // Save current page
}

/**
 * Initializes UI components and renders initial states based on app data.
 */
function initializeUI() {
    // Set initial values for settings form from app state
    if (app.hackathonSettings.name) {
        elements.hackathonName.value = app.hackathonSettings.name;
    }
    if (app.hackathonSettings.startDate) {
        elements.startDate.value = formatDateTimeLocal(app.hackathonSettings.startDate);
    }
    if (app.hackathonSettings.duration) {
        elements.duration.value = app.hackathonSettings.duration;
    } else {
        elements.duration.value = '48'; // Default to 48 hours
        app.hackathonSettings.duration = 48;
    }

    // Set initial project idea
    if (elements.projectIdeaInput) {
        elements.projectIdeaInput.value = app.projectIdea || '';
    }

    // Set AI provider and model based on local storage
    const savedAIProvider = localStorage.getItem('ai_provider') || 'groq'; // Default to Groq
    const aiProviderSelect = document.getElementById('ai-provider');
    if (aiProviderSelect) {
        aiProviderSelect.value = savedAIProvider;
        toggleApiKeyInput(savedAIProvider); // This will also set up models
    }
}


/**
 * Sets up all global event listeners for UI interactions.
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
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('aside');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (sidebarToggle && sidebar && sidebarOverlay) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('!translate-x-0'); // Use !important to override lg:translate-x-0
            sidebarOverlay.classList.toggle('hidden');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }

    // Settings form submission
    if (elements.settingsForm) {
        elements.settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

    // Add team member button
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

    // AI Chat form submission
    if (elements.chatForm) {
        elements.chatForm.addEventListener('submit', handleChatFormSubmit);
    }

    // AI Provider selection change
    const aiProviderSelect = document.getElementById('ai-provider');
    if (aiProviderSelect) {
        aiProviderSelect.addEventListener('change', (e) => {
            const selectedProvider = e.target.value;
            localStorage.setItem('ai_provider', selectedProvider);
            toggleApiKeyInput(selectedProvider);
            // Also update the API key field with the saved key for the new provider
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) {
                apiKeyInput.value = localStorage.getItem(`${selectedProvider}_api_key`) || '';
            }
        });
    }

    // AI Model selection change
    const aiModelSelect = document.getElementById('ai-model');
    if (aiModelSelect) {
        aiModelSelect.addEventListener('change', (e) => {
            const currentProvider = document.getElementById('ai-provider').value;
            localStorage.setItem(`${currentProvider}_model`, e.target.value); // Save model per provider
        });
    }

    // API Key input change (save key to local storage)
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', (e) => {
            const currentProvider = document.getElementById('ai-provider').value;
            localStorage.setItem(`${currentProvider}_api_key`, e.target.value);
        });
    }

    // Custom endpoint input change (save endpoint to local storage)
    const apiEndpointInput = document.getElementById('api-endpoint');
    if (apiEndpointInput) {
        apiEndpointInput.addEventListener('input', (e) => {
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
    const aiModelSelect = document.getElementById('ai-model');
    const aiModelLabel = document.getElementById('ai-model-label');
    const customEndpointSection = document.getElementById('custom-endpoint-section');
    const apiEndpointInput = document.getElementById('api-endpoint');

    // Show/hide API Key section
    if (apiKeySection) {
        // Groq requires an API key on the frontend now
        if (provider === 'google') { // Google Gemini Flash API key is provided by the environment
            apiKeySection.classList.add('hidden');
        } else {
            apiKeySection.classList.remove('hidden');
        }
    }

    // Show/hide Custom Endpoint section
    if (customEndpointSection) {
        if (provider === 'other') {
            customEndpointSection.classList.remove('hidden');
            apiEndpointInput.value = localStorage.getItem('other_endpoint') || '';
        } else {
            customEndpointSection.classList.add('hidden');
        }
    }

    // Update model options and label based on provider
    if (aiModelSelect) {
        aiModelSelect.innerHTML = ''; // Clear existing options
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
                models = ['llama3-8b-8192', 'mixtral-8x7b-32768', 'llama2-70b-4096']; // Updated default and added other Groq models
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
            aiModelSelect.appendChild(option);
        });

        // Set saved model for the current provider or default to the first model
        const savedModel = localStorage.getItem(`${provider}_model`);
        if (savedModel && models.includes(savedModel)) {
            aiModelSelect.value = savedModel;
        } else {
            aiModelSelect.value = models[0]; // Default to the first model in the list
            localStorage.setItem(`${provider}_model`, models[0]);
        }
    }

    if (aiModelLabel) {
        aiModelLabel.textContent = labelText;
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


// ========== Onboarding Functions ==========

/**
 * Shows the onboarding modal if the user hasn't seen it before.
 */
function showOnboarding() {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding || true) { // Always show for now during development
        elements.onboardingModal.classList.remove('hidden');
        renderOnboardingStep(1);
    }
}

/**
 * Renders a specific step of the onboarding process.
 * @param {number} step - The step number to render (1, 2, or 3).
 */
function renderOnboardingStep(step) {
    let content = '';
    let buttons = '';

    if (step === 1) {
        content = `
            <h3 class="text-2xl font-bold mb-4 text-blue-700">Welcome to HackManager! 👋</h3>
            <p class="text-gray-700 mb-6">
                Your AI-powered co-pilot for hackathon planning. Let's get your project set up!
            </p>
            <form id="onboarding-settings-form" class="space-y-4 text-left">
                <div>
                    <label for="onboarding-hackathon-name" class="form-label">Hackathon Name</label>
                    <input type="text" id="onboarding-hackathon-name" class="form-input" placeholder="e.g. My Awesome Hackathon" required value="${app.hackathonSettings.name || ''}">
                </div>
                <div>
                    <label for="onboarding-start-date" class="form-label">Start Date & Time</label>
                    <input type="datetime-local" id="onboarding-start-date" class="form-input" required value="${app.hackathonSettings.startDate ? formatDateTimeLocal(app.hackathonSettings.startDate) : ''}">
                </div>
                <div>
                    <label for="onboarding-duration" class="form-label">Duration (hours)</label>
                    <select id="onboarding-duration" class="form-input" required>
                        <option value="24">24 hours</option>
                        <option value="36">36 hours</option>
                        <option value="48" ${app.hackathonSettings.duration === 48 ? 'selected' : ''}>48 hours</option>
                        <option value="72">72 hours</option>
                        <option value="120">120 hours (5 days)</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary w-full mt-4">Next: Add Team Members</button>
            </form>
        `;
    } else if (step === 2) {
        content = `
            <h3 class="text-2xl font-bold mb-4 text-blue-700">Tell us about your Team 🧑‍💻</h3>
            <p class="text-gray-700 mb-6">
                Add your team members. You can always add more later in the Team section.
            </p>
            <div id="onboarding-team-list" class="space-y-3 max-h-48 overflow-y-auto custom-scrollbar bg-gray-100 p-3 rounded-md mb-4">
                <!-- Team members will be added here dynamically -->
                ${app.teamMembers.length > 0 ? app.teamMembers.map((member, index) => `
                    <div class="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
                        <span class="team-badge team-member-${member.colorIndex + 1}">${member.name}</span>
                        <div class="text-sm text-gray-600">Sleep: ${member.sleepStart}-${member.sleepEnd}</div>
                        <button type="button" onclick="removeOnboardingTeamMember('${member.id}')" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('') : '<p class="text-center text-gray-500 py-4">No members added yet.</p>'}
            </div>
            <form id="onboarding-add-member-form" class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div class="md:col-span-1">
                    <label for="onboarding-member-name" class="form-label">Name</label>
                    <input type="text" id="onboarding-member-name" class="form-input" placeholder="Name" required>
                </div>
                <div class="md:col-span-1">
                    <label for="onboarding-sleep-start" class="form-label">Sleep Start (24h)</label>
                    <input type="time" id="onboarding-sleep-start" class="form-input" value="23:00" required>
                </div>
                <div class="md:col-span-1">
                    <label for="onboarding-sleep-end" class="form-label">Sleep End (24h)</label>
                    <input type="time" id="onboarding-sleep-end" class="form-input" value="07:00" required>
                </div>
                <div class="md:col-span-3">
                    <label for="onboarding-skills" class="form-label">Skills (comma-separated)</label>
                    <input type="text" id="onboarding-skills" class="form-input" placeholder="e.g. Frontend, Backend, UI/UX">
                </div>
                <button type="submit" class="btn btn-secondary w-full md:col-span-3">Add Member</button>
            </form>
            <div class="flex justify-between mt-6">
                <button onclick="renderOnboardingStep(1)" class="btn btn-secondary px-6 py-2">Back</button>
                <button onclick="renderOnboardingStep(3)" class="btn btn-primary px-6 py-2">Next: Project Idea</button>
            </div>
        `;
        // Attach form listener dynamically after content is set
        setTimeout(() => {
            document.getElementById('onboarding-add-member-form').addEventListener('submit', handleOnboardingAddMember);
        }, 0);

    } else if (step === 3) {
        content = `
            <h3 class="text-2xl font-bold mb-4 text-blue-700">Your Project Idea 💡</h3>
            <p class="text-gray-700 mb-6">
                Briefly describe your hackathon project. The AI will use this to generate tasks.
            </p>
            <textarea id="onboarding-project-idea" class="form-input h-32" placeholder="e.g., A web app for real-time collaborative document editing with AI summarization" required>${app.projectIdea || ''}</textarea>
            <div class="flex justify-between mt-6">
                <button onclick="renderOnboardingStep(2)" class="btn btn-secondary px-6 py-2">Back</button>
                <button onclick="completeOnboarding()" class="btn btn-primary px-6 py-2">Finish Setup</button>
            </div>
        `;
    }

    elements.onboardingContent.innerHTML = content;

    // Add event listener for settings form if step 1
    if (step === 1) {
        document.getElementById('onboarding-settings-form').addEventListener('submit', handleOnboardingSettingsSubmit);
    }
}

/**
 * Handles the submission of the onboarding settings form (step 1).
 * Saves hackathon settings and proceeds to step 2.
 * @param {Event} event - The form submission event.
 */
function handleOnboardingSettingsSubmit(event) {
    event.preventDefault();
    app.hackathonSettings.name = document.getElementById('onboarding-hackathon-name').value;
    app.hackathonSettings.startDate = new Date(document.getElementById('onboarding-start-date').value);
    app.hackathonSettings.duration = parseInt(document.getElementById('onboarding-duration').value);
    saveToLocalStorage();
    renderOnboardingStep(2);
}

/**
 * Handles the submission of the onboarding add member form (step 2).
 * Adds a new team member and re-renders the list.
 * @param {Event} event - The form submission event.
 */
function handleOnboardingAddMember(event) {
    event.preventDefault();
    const nameInput = document.getElementById('onboarding-member-name');
    const sleepStartInput = document.getElementById('onboarding-sleep-start');
    const sleepEndInput = document.getElementById('onboarding-sleep-end');
    const skillsInput = document.getElementById('onboarding-skills');

    const newMember = {
        id: generateId(),
        name: nameInput.value,
        sleepStart: sleepStartInput.value,
        sleepEnd: sleepEndInput.value,
        skills: skillsInput.value.split(',').map(s => s.trim()).filter(s => s) || [],
        colorIndex: app.teamMembers.length % 8 // Assign a color
    };
    app.teamMembers.push(newMember);
    saveToLocalStorage();
    renderOnboardingStep(2); // Re-render to show new member
    
    // Clear form fields
    nameInput.value = '';
    skillsInput.value = '';
    nameInput.focus();
}

/**
 * Removes a team member during the onboarding process.
 * @param {string} memberId - The ID of the member to remove.
 */
function removeOnboardingTeamMember(memberId) {
    app.teamMembers = app.teamMembers.filter(member => member.id !== memberId);
    saveToLocalStorage();
    renderOnboardingStep(2); // Re-render to show updated list
}

/**
 * Completes the onboarding process, hides the modal, and redirects to AI Assistant.
 * Triggers initial AI task generation if a project idea was provided.
 */
function completeOnboarding() {
    app.projectIdea = document.getElementById('onboarding-project-idea').value;
    saveToLocalStorage();
    localStorage.setItem('hasSeenOnboarding', 'true');
    elements.onboardingModal.classList.add('hidden');
    showPage('ai-assistant'); // Redirect to AI Assistant page after onboarding
    displayChatHistory(); // Ensure chat history is displayed

    // Trigger initial AI task generation after onboarding if a project idea was provided
    if (app.projectIdea) {
        showMessage('Generating Tasks...', 'Please wait while AI generates your initial tasks. This might take a moment.', 'alert', () => {
            const selectedProvider = localStorage.getItem('ai_provider') || 'groq';
            generateTasksWithAI(app.projectIdea, selectedProvider); // Call the AI for task generation
        });
    }
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
        memberDiv.className = `flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${app.selectedMemberId === member.id ? 'bg-blue-100 border border-blue-400' : 'bg-white shadow-sm'}`;
        memberDiv.innerHTML = `
            <span class="team-badge team-member-${member.colorIndex + 1} text-sm">${member.name}</span>
            <div class="text-xs text-gray-500">Sleep: ${member.sleepStart}-${member.sleepEnd}</div>
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
        <h4 class="font-semibold text-lg mb-4">${isEditing ? 'Edit Team Member' : 'Add New Team Member'}</h4>
        <form id="member-form" class="space-y-4">
            <div>
                <label for="member-name" class="form-label">Name</label>
                <input type="text" id="member-name" class="form-input" value="${member ? member.name : ''}" required>
            </div>
            <div>
                <label for="member-sleep-start" class="form-label">Sleep Start (24h format)</label>
                <input type="time" id="member-sleep-start" class="form-input" value="${member ? member.sleepStart : '23:00'}" required>
            </div>
            <div>
                <label for="member-sleep-end" class="form-label">Sleep End (24h format)</label>
                <input type="time" id="member-sleep-end" class="form-input" value="${member ? member.sleepEnd : '07:00'}" required>
            </div>
            <div>
                <label for="member-skills" class="form-label">Skills (comma-separated, e.g., Frontend, Backend, UI/UX)</label>
                <input type="text" id="member-skills" class="form-input" value="${member && member.skills ? member.skills.join(', ') : ''}">
            </div>
            <div class="flex justify-end gap-3 pt-4">
                ${isEditing ? `
                    <button type="button" onclick="deleteTeamMember('${memberId}')" class="btn bg-red-500 hover:bg-red-600">Delete Member</button>
                ` : ''}
                <button type="submit" class="btn btn-primary">${isEditing ? 'Update Member' : 'Add Member'}</button>
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
            <h5 class="font-semibold text-gray-700 mt-4 mb-2">Individual Workload:</h5>
            <ul class="space-y-2">
                ${Object.values(currentWorkload).map(work => `
                    <li class="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                        <span>${work.name}</span>
                        <span class="text-sm text-gray-600">${work.tasksAssigned} tasks, ${work.hoursAssigned} hours</span>
                    </li>
                `).join('')}
            </ul>
        `;
    } else {
        workloadHtml = '<p class="text-gray-500 mt-4">Add team members to see individual workloads.</p>';
    }


    elements.teamStats.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-blue-700">Total Team Members</p>
                <p class="text-2xl font-bold text-blue-900">${totalMembers}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <p class="text-sm text-green-700">Total Tasks</p>
                <p class="text-2xl font-bold text-green-900">${totalTasks}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
                <p class="text-sm text-yellow-700">Tasks Completed</p>
                <p class="text-2xl font-bold text-yellow-900">${completedTasks} / ${totalTasks}</p>
            </div>
        </div>
        ${workloadHtml}
    `;
}

// ========== AI Assistant Functions ==========

/**
 * Handles the submission of the chat form, sending the user's message to the AI.
 * @param {Event} event - The form submission event.
 */
async function handleChatFormSubmit(event) {
    event.preventDefault();
    const chatInput = elements.chatInput;
    const userMessage = chatInput.value.trim();

    if (!userMessage) return;

    // Add user message to chat history
    app.chatHistory.push({ role: 'user', content: userMessage });
    displayChatHistory();
    chatInput.value = ''; // Clear input field

    // Show loading indicator
    elements.aiResponse.innerHTML = `
        <div class="flex items-center justify-center space-x-2 text-gray-600">
            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            <span>AI is thinking...</span>
        </div>
    `;
    elements.aiResponse.classList.remove('hidden');

    try {
        const progressCallback = (progress, message) => {
            elements.aiResponse.innerHTML = `
                <div class="flex items-center justify-center space-x-2 text-gray-600">
                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    <span>${message} (${progress}%)</span>
                </div>
            `;
        };

        const projectIdea = app.projectIdea || userMessage; // Use provided project idea or current user message
        const selectedProvider = document.getElementById('ai-provider').value;

        // If the user's message looks like a project idea or initial query, try to generate tasks
        // Otherwise, treat as a general chat interaction (which for now falls back to local generation)
        const isProjectIdeaQuery = userMessage.toLowerCase().includes('project idea') ||
                                   userMessage.toLowerCase().includes('generate tasks') ||
                                   app.allTasks.length === 0;

        let generatedTasks;
        if (isProjectIdeaQuery) {
            generatedTasks = await generateTasksWithAI(projectIdea, selectedProvider, progressCallback);
        } else {
            // For general chat, fallback to local generation or a simpler AI response
            // In a more advanced version, this would be a separate LLM call for conversational AI
            generatedTasks = generateProjectTasks(projectIdea, progressCallback);
        }

        app.allTasks = generatedTasks; // Overwrite or append based on logic in generateTasksWithAI/generateProjectTasks
        saveToLocalStorage();

        // Add AI response to chat history
        const aiMessage = {
            role: 'ai',
            content: generatedTasks.length > 0 ? `I've generated ${generatedTasks.length} tasks for "${projectIdea}". You can view them in the Calendar section.` : "I couldn't generate tasks based on that. Please try rephrasing your project idea or check your settings."
        };
        app.chatHistory.push(aiMessage);
        displayChatHistory();
        
        displayGeneratedTasks(generatedTasks); // Show the tasks on the AI Assistant page
        
        elements.aiResponse.classList.add('hidden'); // Hide loading
    } catch (error) {
        console.error('Error generating tasks:', error);
        elements.aiResponse.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
        elements.aiResponse.classList.remove('hidden');
        app.chatHistory.push({ role: 'ai', content: `Sorry, I encountered an error: ${error.message}. Please check your API key or try again.` });
        displayChatHistory();
    }
}

/**
 * Displays the chat history messages in the AI Assistant section.
 */
function displayChatHistory() {
    elements.chatHistory.innerHTML = ''; // Clear existing messages
    app.chatHistory.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `p-3 rounded-lg mb-2 ${msg.role === 'user' ? 'bg-blue-100 self-end text-right ml-auto' : 'bg-gray-200 self-start text-left mr-auto'}`;
        messageDiv.style.maxWidth = '80%';
        messageDiv.innerHTML = `<strong>${msg.role === 'user' ? 'You' : 'AI'}:</strong> ${msg.content}`;
        elements.chatHistory.appendChild(messageDiv);
    });
    // Scroll to bottom
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
}

/**
 * Generates tasks using the specified AI provider (Groq, OpenAI, etc.).
 * @param {string} projectIdea - The main project idea.
 * @param {string} provider - The AI provider to use.
 * @param {function} updateProgress - Callback to update UI with progress messages.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of generated task objects.
 */
async function generateTasksWithAI(projectIdea, provider, updateProgress) {
    const apiKey = localStorage.getItem(`${provider}_api_key`) || '';
    const selectedModel = localStorage.getItem(`${provider}_model`);
    let apiUrl;
    let payload;
    let headers = { 'Content-Type': 'application/json' };

    const startDate = new Date(app.hackathonSettings.startDate);
    const totalHours = app.hackathonSettings.duration;
    const teamMembers = app.teamMembers;

    if (teamMembers.length === 0) {
        showMessage('No Team Members', 'Please add at least one team member in the Team section to enable AI task assignment.', 'alert');
        return generateProjectTasks(projectIdea, updateProgress); // Fallback to local generation
    }

    const prompt = `You are a hackathon project manager. Generate a detailed task breakdown for a ${totalHours}-hour hackathon project.

Project Idea: ${projectIdea}

Team Members with Skills and Sleep Schedules:
${teamMembers.map(m => `- ${m.name}: Skills: [${m.skills.join(', ') || 'No specific skills listed'}], Sleep: ${m.sleepStart}-${m.sleepEnd}`).join('\n')}

Start Date: ${startDate.toISOString()}
Duration: ${totalHours} hours

IMPORTANT CONSTRAINTS:
1. Assign tasks based on team members' skills when possible.
2. NEVER schedule tasks during a team member's sleep hours.
3. Ensure task start and end times are within the hackathon's overall duration (${totalHours} hours).
4. Use 24-hour time format for all times.
5. Allocate tasks to specific team members by their name.
6. The total estimated hours for all tasks should be roughly equal to the hackathon duration.

Generate a comprehensive list of tasks in JSON format. Each task object should have the following properties:
- "title": string - Clear, action-oriented task name.
- "description": string - Detailed description of what needs to be done.
- "phase": string - One of "planning", "design", "development", "integration", "testing", "presentation".
- "estimatedHours": number - Realistic time estimate in hours (integer).
- "priority": string - "high", "medium", or "low".
- "assignedTo": string - The NAME of the team member assigned to this task (e.g., "Alice", "Bob"). Ensure it matches one of the provided team member names exactly.

Skill mapping guide:
- Frontend tasks → members with Frontend, UI/UX skills
- Backend tasks → members with Backend, Database skills
- Mobile tasks → members with Mobile skills
- AI/ML tasks → members with AI/ML skills
- Testing tasks → members with Testing skills
- Planning tasks → members with Project Management skills

Allocate time wisely for phases:
- Planning: ~10% (research, brainstorming)
- Design: ~15% (architecture, UI/UX)
- Development: ~50% (core features)
- Integration: ~10% (connecting components)
- Testing: ~10% (QA, bug fixes)
- Presentation: ~5% (demo prep)

Return ONLY a JSON array of task objects, formatted exactly as specified, without any additional text or markdown outside the JSON.`;

    // Determine API URL and payload structure based on provider
    switch (provider) {
        case 'groq':
            apiUrl = '/groq'; // Use the local proxy endpoint
            // API key is handled by the server-side proxy for Groq
            // Frontend doesn't send the API key directly to Groq.
            payload = {
                model: selectedModel,
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
                max_tokens: 2000,
                // Groq's API often returns JSON directly based on prompt, but adding
                // response_format could be beneficial if supported explicitly.
                // For now, rely on prompt and robust parsing.
            };
            break;
        case 'openai':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            payload = {
                model: selectedModel,
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
                max_tokens: 2000,
                response_format: { type: "json_object" } // OpenAI specific for JSON
            };
            break;
        case 'anthropic':
            apiUrl = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            payload = {
                model: selectedModel,
                max_tokens: 2000,
                temperature: 0.7,
                system: 'You are a helpful hackathon project manager that generates detailed task breakdowns. Always respond with valid JSON arrays only.',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            };
            break;
        case 'google':
            // The Canvas environment automatically provides the API key for gemini-2.0-flash
            // No need for a manual API key input from the user in the UI for this model.
            apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'; // Default to gemini-2.0-flash
            payload = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2000,
                    responseMimeType: "application/json", // Crucial for structured output
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "title": { "type": "STRING" },
                                "description": { "type": "STRING" },
                                "phase": { "type": "STRING", "enum": ["planning", "design", "development", "integration", "testing", "presentation"] },
                                "estimatedHours": { "type": "NUMBER" },
                                "priority": { "type": "STRING", "enum": ["high", "medium", "low"] },
                                "assignedTo": { "type": "STRING" }
                            },
                            required: ["title", "description", "phase", "estimatedHours", "priority", "assignedTo"]
                        }
                    }
                }
            };
            // Note: API_KEY is intentionally left as "" in the payload for Google models in Canvas environment.
            // Canvas will inject it at runtime.
            break;
        case 'cohere':
            apiUrl = 'https://api.cohere.ai/v1/chat';
            headers['Authorization'] = `Bearer ${apiKey}`;
            payload = {
                model: selectedModel,
                message: prompt,
                temperature: 0.7,
                preamble: 'You are a helpful hackathon project manager that generates detailed task breakdowns. Always respond with valid JSON arrays only.',
                response_format: { type: "json_object" }
            };
            break;
        case 'other':
            apiUrl = localStorage.getItem('other_endpoint');
            headers['Authorization'] = `Bearer ${apiKey}`;
            // Assuming 'other' endpoint is OpenAI-compatible
            payload = {
                model: selectedModel,
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
                max_tokens: 2000,
                response_format: { type: "json_object" }
            };
            break;
        default:
            throw new Error('Invalid AI provider selected.');
    }

    // For Groq (proxied via server.js), API key is handled by the server.
    // For other providers (direct frontend call), check if API key is set.
    if (!apiKey && provider !== 'google' && provider !== 'groq') {
        throw new Error(`API key for ${provider} is not set. Please go to Settings to enter it.`);
    }
    if (provider === 'other' && !apiUrl) {
        throw new Error('Custom API Endpoint is not set for "Other" provider. Please go to Settings to enter it.');
    }

    try {
        updateProgress(20, 'Sending request to AI...');
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
        
        // Parse the AI response JSON
        let tasks;
        try {
            // Some models might wrap JSON in markdown code blocks, try to extract if necessary
            const jsonMatch = aiResponseContent.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                tasks = JSON.parse(jsonMatch[1]);
            } else {
                tasks = JSON.parse(aiResponseContent);
            }
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', aiResponseContent, parseError);
            throw new Error('AI response was not valid JSON. Please try again or check prompt.');
        }
        
        // Process and validate tasks
        const processedTasks = tasks.map((task, index) => {
            // Find team member by name (case-insensitive search)
            const assignedMember = teamMembers.find(m => m.name.toLowerCase() === task.assignedTo.toLowerCase());
            const assignedMemberId = assignedMember ? assignedMember.id : null;

            // Handle scenario where assigned member from AI is not found
            if (!assignedMemberId) {
                 console.warn(`AI assigned task "${task.title}" to "${task.assignedTo}" but no such member found. Assigning to a random member.`);
            }
            
            // Fallback to random assignment if assigned member is not found or no members exist
            const finalAssignedMemberId = assignedMemberId || (teamMembers.length > 0 ? teamMembers[index % teamMembers.length].id : null);
            if (!finalAssignedMemberId) {
                console.error(`Cannot assign task "${task.title}": No team members available.`);
                return null; // Or handle as an unassigned task
            }

            // Calculate task dates, respecting sleep schedules and total hackathon duration
            let taskStart = addHours(startDate, app.allTasks.length > 0 ? app.allTasks[app.allTasks.length - 1].endDate : 0); // Start after last task
            if (index === 0) taskStart = new Date(startDate); // First task starts at hackathon start

            taskStart = getNextAvailableTime(taskStart, finalAssignedMemberId, startDate, totalHours);
            let taskEnd = addHours(taskStart, task.estimatedHours || 1);

            // Ensure task doesn't go beyond hackathon end date
            const hackathonEndDate = calculateEndDate(startDate, totalHours);
            if (taskEnd > hackathonEndDate) {
                // If task exceeds hackathon end, clip it or re-evaluate.
                // For simplicity, we will clip it and warn. In a real app,
                // you might split it or re-prioritize.
                taskEnd = hackathonEndDate;
                const actualHours = (taskEnd - taskStart) / (1000 * 60 * 60);
                if (actualHours < (task.estimatedHours || 1)) {
                    console.warn(`Task "${task.title}" adjusted to fit hackathon duration. Estimated ${task.estimatedHours}h, but only ${actualHours.toFixed(1)}h could be allocated.`);
                    task.estimatedHours = parseFloat(actualHours.toFixed(1)); // Update estimated hours
                }
            }


            return {
                id: generateId(), // Ensure unique ID for AI-generated tasks
                title: task.title || 'Untitled Task',
                description: task.description || '',
                phase: task.phase || 'development',
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: task.estimatedHours || 1,
                priority: task.priority || 'medium',
                assignedTo: [finalAssignedMemberId], // Always an array
                status: 'Not Started'
            };
        }).filter(task => task !== null); // Filter out any null tasks if assignment failed

        // Sort tasks by start date
        processedTasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        
        return processedTasks;
        
    } catch (error) {
        console.error(`API error for ${provider}:`, error);
        showMessage('AI Error', `Failed to get tasks from AI: ${error.message}. Please check your API key and selected model in Settings, or try a different prompt.`, 'alert');
        // Fallback to local generation if AI call fails
        console.log('Falling back to local task generation');
        return generateProjectTasks(projectIdea, updateProgress);
    }
}

/**
 * Async version of generateProjectTasks to prevent UI blocking.
 * @param {string} projectIdea - The project idea.
 * @param {function} updateProgress - Callback to update UI with progress messages.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of generated task objects.
 */
async function generateProjectTasksAsync(projectIdea, updateProgress) {
    // Use requestAnimationFrame to keep UI responsive
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    return generateProjectTasks(projectIdea, updateProgress);
}

/**
 * Generates project tasks locally based on a project idea and hackathon settings.
 * This serves as a fallback or a simpler generation method.
 * @param {string} projectIdea - The main project idea.
 * @param {function} [updateProgress=null] - Optional callback to update UI with progress messages.
 * @returns {Array<object>} An array of generated task objects.
 */
function generateProjectTasks(projectIdea, updateProgress = null) {
    const tasks = [];
    const startDate = new Date(app.hackathonSettings.startDate);
    const totalHours = app.hackathonSettings.duration;
    const teamSize = app.teamMembers.length;
    
    if (teamSize === 0) {
        showMessage('No Team Members', 'Please add at least one team member in the Team section to generate tasks.', 'alert');
        return [];
    }

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
        testing: 0.10,       // 10% for testing
        presentation: 0.05   // 5% for presentation prep
    };
    
    let currentTime = 0; // Tracks elapsed time from hackathon start for task scheduling
    
    /**
     * Helper function to assign team members based on skills and availability.
     * @param {string} taskPhase - The phase of the task.
     * @param {string} taskTitle - The title of the task.
     * @returns {string} The ID of the assigned team member.
     */
    const assignMember = (taskPhase, taskTitle) => {
        // More detailed skill mapping based on task titles and content
        const taskSkillMap = {
            'kickoff': ['Project Management', 'Leadership', 'Communication'],
            'brainstorm': ['Project Management', 'Creative', 'Leadership'],
            'research': ['Research', 'Analysis', 'Documentation'],
            'feasibility': ['Technical Lead', 'Architecture', 'Analysis'],
            'architecture': ['Architecture', 'Backend', 'System Design', 'Technical Lead'],
            'ui/ux': ['UI Design', 'UX Research', 'Frontend', 'Design', 'Figma', 'Adobe'],
            'wireframe': ['UI Design', 'UX Research', 'Design', 'Figma'],
            'database': ['Database', 'Backend', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL'],
            'frontend': ['Frontend', 'React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'HTML', 'CSS'],
            'backend': ['Backend', 'Node.js', 'Python', 'Java', 'API', 'REST APIs', 'GraphQL'],
            'mobile': ['Mobile', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'iOS', 'Android'],
            'ai': ['AI/ML', 'Machine Learning', 'Data Science', 'Python', 'TensorFlow', 'PyTorch'],
            'api': ['Backend', 'REST APIs', 'GraphQL', 'Node.js', 'Express'],
            'integration': ['Backend', 'DevOps', 'CI/CD', 'Docker', 'Kubernetes'],
            'deployment': ['DevOps', 'Cloud Computing', 'AWS', 'Azure', 'GCP', 'Docker'],
            'testing': ['Testing', 'QA', 'Test Automation', 'Selenium', 'Jest', 'Unit Testing'],
            'bug': ['Testing', 'Debugging', 'QA'],
            'demo': ['Project Management', 'Presentation', 'Communication'],
            'presentation': ['UI/UX', 'Design', 'Presentation', 'Communication']
        };
        
        const titleLower = taskTitle.toLowerCase();
        let relevantSkills = [];
        
        Object.entries(taskSkillMap).forEach(([keyword, skills]) => {
            if (titleLower.includes(keyword)) {
                relevantSkills = [...new Set([...relevantSkills, ...skills])];
            }
        });
        
        if (relevantSkills.length === 0) {
            const phaseSkillMap = {
                'planning': ['Project Management', 'Leadership', 'Communication'],
                'design': ['UI/UX', 'Frontend', 'Design', 'Architecture'],
                'development': ['Frontend', 'Backend', 'Mobile', 'Database', 'AI/ML'],
                'integration': ['Backend', 'DevOps', 'Database', 'API'],
                'testing': ['Testing', 'QA', 'DevOps'],
                'presentation': ['Project Management', 'UI/UX', 'Communication']
            };
            relevantSkills = phaseSkillMap[taskPhase] || [];
        }
        
        // Score team members based on skill matches and current workload
        const memberScores = app.teamMembers.map(member => {
            let score = 0;
            
            member.skills.forEach(memberSkill => {
                const memberSkillLower = memberSkill.toLowerCase();
                for (const requiredSkill of relevantSkills) {
                    const requiredSkillLower = requiredSkill.toLowerCase();
                    if (memberSkillLower === requiredSkillLower) {
                        score += 3; // Exact match
                        break;
                    } else if (memberSkillLower.includes(requiredSkillLower) || requiredSkillLower.includes(memberSkillLower)) {
                        score += 2; // Partial match
                    }
                }
            });
            
            // Consider workload balance - prefer members with fewer assigned tasks
            const assignedTaskCount = app.allTasks.filter(t =>
                Array.isArray(t.assignedTo) ? t.assignedTo.includes(member.id) : t.assignedTo === member.id
            ).length;
            score -= assignedTaskCount * 0.5; // Reduce score for heavily loaded members
            
            return { member, score };
        });
        
        // Sort by score and get best match
        memberScores.sort((a, b) => b.score - a.score);
        
        // If there's a clear best match, use them. Otherwise, rotate for balance.
        if (memberScores.length > 1 && memberScores[0].score > memberScores[1].score + 1) {
            return memberScores[0].member.id;
        } else if (memberScores.length > 0) {
            // Rotate among top scorers to distribute workload
            const topScore = memberScores[0].score;
            const topScorers = memberScores.filter(ms => ms.score >= topScore - 1).map(ms => ms.member);
            return topScorers[tasks.length % topScorers.length].id; // Use `tasks.length` to ensure unique rotation each time
        }
        
        return app.teamMembers[0].id; // Fallback to first member if no criteria met
    };
    
    /**
     * Helper function to check if a given date/time falls within a member's sleep schedule.
     * @param {Date} date - The date and time to check.
     * @param {object} member - The team member object.
     * @returns {boolean} True if the time is during sleep, false otherwise.
     */
    const isDuringSleep = (date, member) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const currentTimeInMinutes = hours * 60 + minutes;

        const sleepStartParts = member.sleepStart.split(':').map(Number);
        const sleepEndParts = member.sleepEnd.split(':').map(Number);

        let sleepStartInMinutes = sleepStartParts[0] * 60 + sleepStartParts[1];
        let sleepEndInMinutes = sleepEndParts[0] * 60 + sleepEndParts[1];

        if (sleepStartInMinutes < sleepEndInMinutes) {
            // Normal sleep schedule (e.g., 23:00 to 07:00)
            return currentTimeInMinutes >= sleepStartInMinutes && currentTimeInMinutes < sleepEndInMinutes;
        } else {
            // Sleep schedule crosses midnight (e.g., 22:00 to 06:00 next day)
            return currentTimeInMinutes >= sleepStartInMinutes || currentTimeInMinutes < sleepEndInMinutes;
        }
    };
    
    /**
     * Helper function to get the next available time for a task, skipping sleep hours.
     * @param {Date} proposedTime - The initial proposed start time.
     * @param {string} assignedMemberId - The ID of the assigned member.
     * @param {Date} hackathonStartDate - The absolute start date of the hackathon.
     * @param {number} totalHackathonHours - The total duration of the hackathon.
     * @returns {Date} The adjusted start time.
     */
    const getNextAvailableTime = (proposedTime, assignedMemberId, hackathonStartDate, totalHackathonHours) => {
        const member = app.teamMembers.find(m => m.id === assignedMemberId);
        if (!member) return proposedTime; // If member not found, no sleep constraint

        let adjustedTime = new Date(proposedTime);
        const hackathonEndTime = calculateEndDate(hackathonStartDate, totalHackathonHours);

        // Ensure task doesn't start before hackathon start
        if (adjustedTime < hackathonStartDate) {
            adjustedTime = new Date(hackathonStartDate);
        }
        
        let attempts = 0;
        const maxAttempts = totalHackathonHours * 2; // Prevent infinite loops
        
        while (isDuringSleep(adjustedTime, member) && attempts < maxAttempts) {
            adjustedTime.setMinutes(adjustedTime.getMinutes() + 30); // Advance by 30 mins
            if (adjustedTime > hackathonEndTime) { // If pushed beyond hackathon end, clip
                adjustedTime = new Date(hackathonEndTime);
                break;
            }
            attempts++;
        }
        
        return adjustedTime;
    };
    
    // Update progress if callback provided
    if (updateProgress) updateProgress(40, 'Generating planning tasks...');
    
    // Phase 1: Planning & Research
    const planningHours = Math.floor(totalHours * timeAllocation.planning);
    let currentTaskStartTime = new Date(startDate);

    if (planningHours > 0) {
        let task1MemberId = assignMember("planning", "Team Kickoff & Brainstorming");
        let task1Start = getNextAvailableTime(currentTaskStartTime, task1MemberId, startDate, totalHours);
        let task1Hours = Math.min(1, planningHours);
        let task1End = addHours(task1Start, task1Hours);
        
        tasks.push({
            id: generateId(), // Ensure unique ID
            title: "Team Kickoff & Brainstorming",
            description: "Initial team meeting to discuss the project idea, establish goals, and align on the vision",
            phase: "planning",
            startDate: task1Start,
            endDate: task1End,
            estimatedHours: task1Hours,
            priority: "high",
            assignedTo: [task1MemberId],
            status: 'Not Started'
        });
        currentTaskStartTime = task1End;
    }

    if (planningHours - 1 > 0) {
        let task2MemberId = assignMember("planning", "Technical Research & Feasibility Study");
        let task2Start = getNextAvailableTime(currentTaskStartTime, task2MemberId, startDate, totalHours);
        let task2Hours = Math.max(1, planningHours - 1);
        let task2End = addHours(task2Start, task2Hours);
        
        tasks.push({
            id: generateId(), // Ensure unique ID
            title: "Technical Research & Feasibility Study",
            description: "Research technical requirements, APIs, libraries, and tools needed for the project",
            phase: "planning",
            startDate: task2Start,
            endDate: task2End,
            estimatedHours: task2Hours,
            priority: "high",
            assignedTo: [task2MemberId],
            status: 'Not Started'
        });
        currentTaskStartTime = task2End;
    }
    
    // Update progress
    if (updateProgress) updateProgress(50, 'Creating design and architecture tasks...');
    
    // Phase 2: Design & Architecture
    const designHours = Math.floor(totalHours * timeAllocation.design);
    if (designHours > 0) {
        let taskMemberId = assignMember("design", "System Architecture Design");
        let taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
        let taskHours = Math.floor(designHours * 0.4);
        let taskEnd = addHours(taskStart, taskHours);

        tasks.push({
            id: generateId(), // Ensure unique ID
            title: "System Architecture Design",
            description: "Create high-level system architecture, define components, and plan data flow",
            phase: "design",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: taskHours,
            priority: "high",
            assignedTo: [taskMemberId],
            status: 'Not Started'
        });
        currentTaskStartTime = taskEnd;

        taskMemberId = assignMember("design", "UI/UX Design & Wireframes");
        taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
        taskHours = Math.floor(designHours * 0.6);
        let tempTaskEnd = addHours(taskStart, taskHours); // Calculate temp end to check against hackathon end
        taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;

        tasks.push({
            id: generateId(), // Ensure unique ID
            title: "UI/UX Design & Wireframes",
            description: "Create user interface designs, wireframes, and user flow diagrams",
            phase: "design",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: taskHours,
            priority: "high",
            assignedTo: [taskMemberId],
            status: 'Not Started'
        });
        currentTaskStartTime = taskEnd;
    }
    
    // Update progress
    if (updateProgress) updateProgress(60, 'Planning development tasks...');
    
    // Phase 3: Core Development
    const devHours = Math.floor(totalHours * timeAllocation.development);
    if (devHours > 0) {
        // Frontend development
        if (isWebApp || isMobile) {
            let taskMemberId = assignMember("development", "Frontend Setup & Base Structure");
            let taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
            let taskHours = Math.floor(devHours * 0.15);
            let taskEnd = addHours(taskStart, taskHours);

            tasks.push({
                id: generateId(), // Ensure unique ID
                title: "Frontend Setup & Base Structure",
                description: "Set up the frontend framework, create base components, and establish project structure",
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: [taskMemberId],
                status: 'Not Started'
            });
            currentTaskStartTime = taskEnd;
            
            taskMemberId = assignMember("development", "Implement Core UI Components");
            taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
            taskHours = Math.floor(devHours * 0.25);
            let tempTaskEnd = addHours(taskStart, taskHours); // Calculate temp end to check against hackathon end
            taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;


            tasks.push({
                id: generateId(), // Ensure unique ID
                title: "Implement Core UI Components",
                description: "Build the main user interface components and pages",
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: [taskMemberId],
                status: 'Not Started'
            });
            currentTaskStartTime = taskEnd;
        }
        
        // Backend development
        if (hasBackend) {
            let taskMemberId = assignMember("development", "Backend API Development");
            let taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
            let taskHours = Math.floor(devHours * 0.3);
            let tempTaskEnd = addHours(taskStart, taskHours);
            taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;

            tasks.push({
                id: generateId(), // Ensure unique ID
                title: "Backend API Development",
                description: "Set up server, create API endpoints, and implement business logic",
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: [taskMemberId],
                status: 'Not Started'
            });
            currentTaskStartTime = taskEnd;
            
            taskMemberId = assignMember("development", "Database Design & Implementation");
            taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
            taskHours = Math.floor(devHours * 0.2);
            tempTaskEnd = addHours(taskStart, taskHours);
            taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;

            tasks.push({
                id: generateId(), // Ensure unique ID
                title: "Database Design & Implementation",
                description: "Design database schema, set up database, and create data models",
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: [taskMemberId],
                status: 'Not Started'
            });
            currentTaskStartTime = taskEnd;
        }
        
        // AI/ML specific tasks
        if (hasAI) {
            let taskMemberId = assignMember("development", "AI Model Development");
            let taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
            let taskHours = Math.floor(devHours * 0.3);
            let tempTaskEnd = addHours(taskStart, taskHours);
            taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;

            tasks.push({
                id: generateId(), // Ensure unique ID
                title: "AI Model Development",
                description: "Develop and train machine learning models for the project",
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: [taskMemberId],
                status: 'Not Started'
            });
            currentTaskStartTime = taskEnd;
        }
        
        // Core feature implementation (general catch-all)
        let taskMemberId = assignMember("development", "Implement Core Features");
        let taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
        let taskHours = Math.floor(devHours * 0.5); // Adjust based on other dev tasks already added
        let tempTaskEnd = addHours(taskStart, taskHours);
        taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;

        tasks.push({
            id: generateId(), // Ensure unique ID
            title: "Implement Core Features",
            description: `Develop the main functionality of the project based on: ${projectIdea.substring(0, Math.min(projectIdea.length, 100))}...`,
            phase: "development",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: taskHours,
            priority: "high",
            assignedTo: [taskMemberId],
            status: 'Not Started'
        });
        currentTaskStartTime = taskEnd;
    }
    
    // Update progress
    if (updateProgress) updateProgress(80, 'Adding integration and testing phases...');
    
    // Phase 4: Integration
    const integrationHours = Math.floor(totalHours * timeAllocation.integration);
    if (integrationHours > 0) {
        let taskMemberId = assignMember("integration", "System Integration");
        let taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
        let tempTaskEnd = addHours(taskStart, integrationHours);
        taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;

        tasks.push({
            id: generateId(), // Ensure unique ID
            title: "System Integration",
            description: "Connect all components, integrate APIs, and ensure smooth data flow",
            phase: "integration",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: integrationHours,
            priority: "medium",
            assignedTo: [taskMemberId],
            status: 'Not Started'
        });
        currentTaskStartTime = taskEnd;
    }
    
    // Phase 5: Testing & Bug Fixes
    const testingHours = Math.floor(totalHours * timeAllocation.testing);
    if (testingHours > 0) {
        let taskMemberId = assignMember("testing", "Testing & Bug Fixes");
        let taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
        let tempTaskEnd = addHours(taskStart, testingHours);
        taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;

        tasks.push({
            id: generateId(), // Ensure unique ID
            title: "Testing & Bug Fixes",
            description: "Perform comprehensive testing, identify bugs, and fix critical issues",
            phase: "testing",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: testingHours,
            priority: "medium",
            assignedTo: [taskMemberId],
            status: 'Not Started'
        });
        currentTaskStartTime = taskEnd;
    }
    
    // Update progress
    if (updateProgress) updateProgress(90, 'Finalizing presentation tasks...');
    
    // Phase 6: Presentation Preparation
    const presentationHours = Math.floor(totalHours * timeAllocation.presentation);
    if (presentationHours > 0) {
        let taskMemberId = assignMember("presentation", "Create Demo & Presentation");
        let taskStart = getNextAvailableTime(currentTaskStartTime, taskMemberId, startDate, totalHours);
        let tempTaskEnd = addHours(taskStart, presentationHours);
        taskEnd = tempTaskEnd > calculateEndDate(startDate, totalHours) ? calculateEndDate(startDate, totalHours) : tempTaskEnd;

        tasks.push({
            id: generateId(), // Ensure unique ID
            title: "Create Demo & Presentation",
            description: "Prepare project demo, create presentation slides, and practice pitch",
            phase: "presentation",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: presentationHours,
            priority: "high",
            assignedTo: [taskMemberId],
            status: 'Not Started'
        });
        currentTaskStartTime = taskEnd;
    }

    // Ensure all tasks have a status
    tasks.forEach(task => {
        if (!task.status) task.status = 'Not Started';
    });

    return tasks;
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
            // Handle both single assignee (legacy) and multiple assignees
            const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
            const assignedMembers = assignees.map(id => app.teamMembers.find(m => m.id === id)).filter(m => m);
            
            html += `
                <div class="bg-gray-50 p-3 rounded">
                    <div class="flex justify-between items-start">
                        <strong>${task.title}</strong>
                        <div class="flex gap-1 flex-wrap">
                            ${assignedMembers.map(member => `
                                <span class="team-badge team-member-${member.colorIndex + 1} text-xs">
                                    ${member.name}
                                </span>
                            `).join('')}
                        </div>
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

/**
 * Exports all application data (settings, team, tasks, project idea) as a JSON file.
 */
function exportTasks() {
    const exportData = {
        projectIdea: app.projectIdea,
        hackathonSettings: app.hackathonSettings,
        teamMembers: app.teamMembers,
        allTasks: app.allTasks
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hackmanager-${app.hackathonSettings.name || 'project'}-${new Date().toISOString().slice(0, 10)}.json`;
    
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
                localStorage.removeItem('hackmanagerData');
                localStorage.removeItem('hasSeenOnboarding');
                // Note: API keys are not cleared by default during import.
                // If you want to import API keys, they would need to be part of the exportData structure.

                // Load imported data into app state
                if (importedData.hackathonSettings) {
                    app.hackathonSettings = importedData.hackathonSettings;
                    if (app.hackathonSettings.startDate) {
                        app.hackathonSettings.startDate = new Date(app.hackathonSettings.startDate);
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

                saveToLocalStorage();
                initializeUI(); // Re-initialize UI with new data
                showPage('ai-assistant'); // Go to AI assistant page
                showMessage('Import Successful', 'Data imported successfully. Your application has been updated.', 'alert');
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

/**
 * Assigns a task to a team member.
 * Supports multiple assignees.
 * @param {string} taskId - The ID of the task.
 * @param {string} memberId - The ID of the member to assign.
 */
function assignTask(taskId, memberId) {
    const task = app.allTasks.find(t => t.id === taskId);
    if (task) {
        // Support multiple assignees
        if (!Array.isArray(task.assignedTo)) {
            task.assignedTo = task.assignedTo ? [task.assignedTo] : [];
        }
        
        // Add member if not already assigned
        if (!task.assignedTo.includes(memberId)) {
            task.assignedTo.push(memberId);
        }
        
        saveToLocalStorage();
        
        // Re-render if on calendar page
        if (app.currentPage === 'calendar') {
            renderTasks();
        }
    }
}

/**
 * Removes a team member's assignment from a task.
 * @param {string} taskId - The ID of the task.
 * @param {string} memberId - The ID of the member to unassign.
 */
function unassignTask(taskId, memberId) {
    const task = app.allTasks.find(t => t.id === taskId);
    if (task && Array.isArray(task.assignedTo)) {
        task.assignedTo = task.assignedTo.filter(id => id !== memberId);
        saveToLocalStorage();
        
        // Re-render if on calendar page
        if (app.currentPage === 'calendar') {
            renderTasks();
        }
    }
}

/**
 * Renders all tasks (currently not used to display on AI Assistant page, but could be).
 */
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
        
        // Handle both single assignee (legacy) and multiple assignees
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
        const assignedMembers = assignees.map(id => app.teamMembers.find(m => m.id === id)).filter(m => m);
        
        taskDiv.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium">${task.title}</h4>
                <div class="flex gap-1 flex-wrap">
                    ${assignedMembers.map(member => `
                        <span class="team-badge team-member-${member.colorIndex + 1} text-xs">${member.name}</span>
                    `).join('')}
                </div>
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
        document.getElementById('calendar-container').innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p>Please configure hackathon settings first (Start Date and Duration).</p>
                <button onclick="showPage('settings')" class="btn btn-primary mt-4">
                    Go to Settings
                </button>
            </div>
        `;
        // Clear headers/time column if settings are invalid
        document.getElementById('time-column').innerHTML = '';
        document.getElementById('calendar-days-header').innerHTML = '';
        document.getElementById('calendar-date-range').textContent = '';
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

/**
 * Renders the time column on the left side of the calendar grid.
 */
function renderTimeColumn() {
    const timeColumn = document.getElementById('time-column');
    if (!timeColumn) return;
    
    timeColumn.innerHTML = '';
    
    // Calculate total hours and create time slots
    const startDate = new Date(app.hackathonSettings.startDate);
    const totalHours = app.hackathonSettings.duration;
    
    // Ensure the time column height matches the grid height for synchronized scrolling
    // This assumes 80px height per hour slot in the main grid
    timeColumn.style.height = `${totalHours * 80}px`; 
    
    for (let i = 0; i <= totalHours; i++) {
        const currentHour = new Date(startDate);
        currentHour.setHours(currentHour.getHours() + i);
        
        const timeSlot = document.createElement('div');
        timeSlot.className = 'absolute w-full text-xs text-gray-500 px-2';
        timeSlot.style.top = `${i * 80}px`; // Position each hour marker
        timeSlot.textContent = currentHour.getHours().toString().padStart(2, '0') + ':00';
        
        timeColumn.appendChild(timeSlot);
    }
}

/**
 * Renders the main calendar grid, including day headers and task elements.
 */
function renderCalendarGrid() {
    const container = document.getElementById('calendar-container');
    const daysHeader = document.getElementById('calendar-days-header');
    const scrollContainer = document.getElementById('calendar-scroll-container');
    const scrollbar = document.getElementById('calendar-scrollbar');
    const scrollbarContent = document.getElementById('scrollbar-content');
    
    if (!container || !daysHeader) return;
    
    container.innerHTML = '';
    daysHeader.innerHTML = '';
    
    // Calculate days in hackathon
    const startDate = new Date(app.hackathonSettings.startDate);
    const endDate = calculateEndDate(startDate, app.hackathonSettings.duration);
    const timeDifference = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)) + 1; // Include start and end day
    
    // Set minimum column width for better visibility, especially for shorter hackathons
    const minColumnWidth = 150; // Minimum width per day column
    const totalWidth = Math.max(days * minColumnWidth, scrollContainer.offsetWidth); // Ensure it's at least visible width
    
    // Create day headers container
    const headerContainer = document.createElement('div');
    headerContainer.className = 'flex h-12';
    headerContainer.style.width = `${totalWidth}px`;
    
    // Create day headers
    for (let d = 0; d < days; d++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + d);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'flex-shrink-0 text-center text-sm font-medium text-gray-700 py-3 border-r border-gray-200';
        dayHeader.style.width = `${totalWidth / days}px`;
        dayHeader.textContent = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        headerContainer.appendChild(dayHeader);
    }
    daysHeader.appendChild(headerContainer);
    
    // Create grid container for tasks and hour lines
    const grid = document.createElement('div');
    grid.className = 'relative';
    grid.style.height = `${app.hackathonSettings.duration * 80}px`; // 80px per hour
    grid.style.width = `${totalWidth}px`;
    
    // Create hour grid lines
    for (let h = 0; h <= app.hackathonSettings.duration; h++) {
        const hourLine = document.createElement('div');
        hourLine.className = 'absolute w-full border-b border-gray-200';
        hourLine.style.top = `${h * 80}px`;
        grid.appendChild(hourLine);
    }
    
    // Create day columns (for vertical dividers)
    const dayColumns = document.createElement('div');
    dayColumns.className = 'absolute inset-0 flex';
    
    for (let d = 0; d < days; d++) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'border-r border-gray-200';
        dayColumn.style.width = `${totalWidth / days}px`;
        dayColumn.onclick = () => { // Allow clicking on day columns to add tasks
            const clickedDate = new Date(startDate);
            clickedDate.setDate(clickedDate.getDate() + d);
            handleCalendarDayClick(clickedDate);
        };
        dayColumns.appendChild(dayColumn);
    }
    grid.appendChild(dayColumns);
    
    // Render tasks with multi-day support
    app.allTasks.forEach(task => {
        const taskElements = createTaskElements(task, startDate, days, totalWidth);
        taskElements.forEach(el => grid.appendChild(el));
    });
    
    container.appendChild(grid);
    
    // Set up scrollbar content width
    if (scrollbarContent) {
        scrollbarContent.style.width = `${totalWidth}px`;
    }
    
    // Set up synchronized scrolling
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
    
    if (assignedMembers.length === 0) return elements; // Don't render unassigned tasks on calendar

    // Use a robust check for valid dates
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) {
        console.warn('Invalid date for task:', task.title, task.startDate, task.endDate);
        return elements;
    }
    
    const calendarEnd = calculateEndDate(calendarStart, app.hackathonSettings.duration);
    
    // Skip tasks completely outside calendar range
    if (taskEnd < calendarStart || taskStart > calendarEnd) return elements;
    
    // Determine the actual start and end for rendering within the calendar bounds
    const effectiveRenderStart = new Date(Math.max(taskStart.getTime(), calendarStart.getTime()));
    const effectiveRenderEnd = new Date(Math.min(taskEnd.getTime(), calendarEnd.getTime()));
    
    // Calculate the day index for starting and ending segment
    // Using floor for startDay to ensure task is shown on its actual start day
    const startDayIndex = Math.floor((effectiveRenderStart.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));
    // Using floor for endDayIndex as well, so if a task ends at 00:00 on day N, it's considered to end on day N-1
    const endDayIndex = Math.floor((effectiveRenderEnd.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));

    const dayWidth = totalWidth / totalDays; // Width of a single day column

    for (let day = startDayIndex; day <= endDayIndex && day < totalDays; day++) {
        // Calculate the segment's start and end within this specific day
        const segmentDayStart = new Date(calendarStart);
        segmentDayStart.setDate(segmentDayStart.getDate() + day);
        segmentDayStart.setHours(0, 0, 0, 0); // Start of the current calendar day

        const segmentDayEnd = new Date(segmentDayStart);
        segmentDayEnd.setDate(segmentDayEnd.getDate() + 1); // End of the current calendar day

        const currentSegmentStart = new Date(Math.max(effectiveRenderStart.getTime(), segmentDayStart.getTime()));
        const currentSegmentEnd = new Date(Math.min(effectiveRenderEnd.getTime(), segmentDayEnd.getTime()));

        if (currentSegmentStart >= currentSegmentEnd) continue; // Skip if this segment is empty

        // Calculate position relative to the start of the entire hackathon
        const minutesFromHackathonStart = (currentSegmentStart.getTime() - calendarStart.getTime()) / (1000 * 60);
        const topPosition = (minutesFromHackathonStart / 60) * 80; // 80px per hour

        // Calculate height of this segment
        const durationMinutes = (currentSegmentEnd.getTime() - currentSegmentStart.getTime()) / (1000 * 60);
        const height = (durationMinutes / 60) * 80;

        const taskEl = document.createElement('div');
        
        // Use gradient if multiple assignees, solid color if single
        if (assignedMembers.length > 1) {
            const colors = assignedMembers.map((member, index) => {
                const color = getComputedStyle(document.documentElement).getPropertyValue(`--team-color-${member.colorIndex + 1}`);
                // Distribute colors evenly across the task bar
                return `${color} ${index / assignedMembers.length * 100}%`;
            });
            taskEl.style.background = `linear-gradient(to right, ${colors.join(', ')})`;
        } else {
            taskEl.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(`--team-color-${assignedMembers[0].colorIndex + 1}`);
        }
        
        taskEl.className = `absolute rounded px-2 py-1 cursor-pointer hover:shadow-lg transition-shadow text-white text-xs overflow-hidden calendar-task`;
        taskEl.style.top = `${topPosition}px`;
        taskEl.style.height = `${Math.max(20, height - 2)}px`; // Minimum height for visibility, -2 for some padding/border
        taskEl.style.left = `${day * dayWidth + 2}px`; // 2px margin from left of column
        taskEl.style.width = `${dayWidth - 4}px`; // -4px for margins (2px left, 2px right)
        taskEl.style.zIndex = '10'; // Ensure tasks are above grid lines
        
        // Add special styling for multi-day tasks (remove relevant rounded corners)
        if (day === startDayIndex && day < endDayIndex) { // Starts on this day, continues to next
            taskEl.classList.add('task-multi-day-start');
        } else if (day > startDayIndex && day < endDayIndex) { // Middle day of a multi-day task
            taskEl.classList.add('task-multi-day-middle');
        } else if (day === endDayIndex && day > startDayIndex) { // Ends on this day, started before
            taskEl.classList.add('task-multi-day-end');
        }
        // If task is a single day, it will just have default rounded class

        taskEl.innerHTML = `
            <div class="font-semibold truncate">${task.title}</div>
            <div class="text-xs opacity-90">${assignedMembers.map(m => m.name).join(', ')}</div>
            ${height > 30 ? `<div class="text-xs opacity-75">${formatTime(currentSegmentStart)} - ${formatTime(currentSegmentEnd)}</div>` : ''}
        `;
        
        taskEl.onclick = (e) => {
            e.stopPropagation(); // Prevent column click from also firing
            showTaskModal(task.id);
        };
        taskEl.title = `${task.title}\nAssigned: ${assignedMembers.map(m => m.name).join(', ')}\nDuration: ${task.estimatedHours}h\nStatus: ${task.status}\n${formatFullDate(task.startDate)} - ${formatFullDate(task.endDate)}`;
        
        elements.push(taskEl);
    }
    
    return elements;
}

// Format time only
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Sets up synchronized scrolling behavior between calendar header and main content.
 */
function setupSynchronizedScrolling() {
    const scrollContainer = document.getElementById('calendar-scroll-container');
    const daysHeader = document.getElementById('calendar-days-header');
    const timeColumn = document.getElementById('time-column');
    const scrollbar = document.getElementById('calendar-scrollbar');
    
    if (!scrollContainer || !daysHeader || !scrollbar || !timeColumn) return;
    
    let isUpdating = false;
    
    // Sync horizontal scrolling (header and main grid)
    const syncHorizontalScroll = (source) => {
        if (isUpdating) return;
        isUpdating = true;
        
        const scrollLeft = source.scrollLeft;
        
        if (source !== scrollContainer) scrollContainer.scrollLeft = scrollLeft;
        if (source !== daysHeader) daysHeader.scrollLeft = scrollLeft;
        if (source !== scrollbar) scrollbar.scrollLeft = scrollLeft;
        
        setTimeout(() => { isUpdating = false; }, 10); // Small delay to avoid infinite loop
    };
    
    // Sync vertical scrolling (time column with main grid)
    const syncVerticalScroll = () => {
        if (isUpdating || !timeColumn) return;
        isUpdating = true;
        
        const scrollTop = scrollContainer.scrollTop;
        // Apply negative transform to time column to make it appear fixed while content scrolls
        timeColumn.style.transform = `translateY(${-scrollTop}px)`;
        
        setTimeout(() => { isUpdating = false; }, 10); // Small delay
    };
    
    // Add scroll event listeners
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

    // Initial sync in case elements are already scrolled
    syncVerticalScroll();
    syncHorizontalScroll(scrollContainer);
}


/**
 * Renders the list of team members for the calendar view's sidebar.
 * This list provides an overview of each member's assigned tasks and hours,
 * and allows clicking to view their detailed tasks in a popup.
 */
function renderTeamMembersSidebar() {
    const membersListContainer = document.getElementById('team-members-calendar-list');
    if (!membersListContainer) return;

    // Clear previous content but keep the main title and grid container
    let membersGrid = membersListContainer.querySelector('.grid');
    if (!membersGrid) {
        membersGrid = document.createElement('div');
        membersGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
        membersListContainer.appendChild(membersGrid);
    }
    membersGrid.innerHTML = '';
    
    if (app.teamMembers.length === 0) {
        membersGrid.innerHTML = '<p class="text-gray-500 text-center col-span-full">No team members added yet.</p>';
        return;
    }

    app.teamMembers.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'cursor-pointer hover:bg-gray-100 p-3 rounded transition-colors bg-white shadow-sm';
        memberItem.onclick = () => showMemberTasks(member.id);
        
        // Count tasks where member is assigned (handle both single and multiple assignees)
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
                <span class="team-badge team-member-${member.colorIndex + 1} text-sm">${member.name}</span>
                <span class="text-xs text-gray-500">${taskCount} tasks</span>
            </div>
            <div class="text-xs text-gray-600 mt-1">${totalHours}h total</div>
        `;
        
        membersGrid.appendChild(memberItem);
    });
}

/**
 * Shows a popup modal displaying all tasks assigned to a specific team member.
 * @param {string} memberId - The ID of the team member whose tasks to display.
 */
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
    
    // Filter tasks where member is assigned (handle both single and multiple assignees)
    const memberTasks = app.allTasks.filter(t => {
        if (Array.isArray(t.assignedTo)) {
            return t.assignedTo.includes(memberId);
        }
        return t.assignedTo === memberId;
    }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime()); // Sort by start date
    
    popupTasks.innerHTML = memberTasks.length > 0 ? memberTasks.map(task => {
        // Get all assignees for this task to show who else is working on it
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
        const assignedMembers = assignees.map(id => app.teamMembers.find(m => m.id === id)).filter(m => m);
        
        return `
            <div class="p-2 bg-white rounded border border-gray-200 cursor-pointer hover:shadow-sm"
                 onclick="showTaskModal('${task.id}')">
                <div class="font-medium">${task.title}</div>
                <div class="text-xs text-gray-500">
                    ${formatDate(task.startDate)} - ${formatDate(task.endDate)}
                    (${task.estimatedHours}h)
                </div>
                <div class="text-xs text-gray-600 mt-1">Phase: ${task.phase} | Priority: ${task.priority} | Status: ${task.status}</div>
                ${assignedMembers.length > 1 ? `
                    <div class="text-xs text-gray-500 mt-1">
                        Assigned with: ${assignedMembers.filter(m => m.id !== memberId).map(m => m.name).join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('') : '<p class="text-gray-500">No tasks assigned yet</p>';
    
    // Show popup
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

// Add task to calendar (placeholder - handled by renderCalendar)
function addTaskToCalendar(task) {
    // This function is conceptually handled by renderCalendar which redraws all tasks
    // after any changes to app.allTasks.
}

/**
 * Handles a click on a calendar day to pre-fill the task modal with the clicked date.
 * @param {Date} date - The date clicked on the calendar.
 */
function handleCalendarDayClick(date) {
    // Pre-fill the task modal with the clicked date
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0); // Default to 9 AM
    
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0); // Default 1 hour duration
    
    // Show modal for new task
    showTaskModal(null);
    
    // Pre-fill dates after modal is rendered
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
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Assigned To</label>
                        <div class="space-y-2 max-h-32 overflow-y-auto custom-scrollbar border p-2 rounded-md">
                            ${app.teamMembers.length > 0 ? app.teamMembers.map(member => {
                                const isAssigned = task && (
                                    Array.isArray(task.assignedTo)
                                        ? task.assignedTo.includes(member.id)
                                        : task.assignedTo === member.id // Backwards compatibility for old single string
                                );
                                return `
                                    <label class="flex items-center cursor-pointer">
                                        <input type="checkbox"
                                               name="assignee"
                                               value="${member.id}"
                                               ${isAssigned ? 'checked' : ''}
                                               class="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                        <span class="team-badge team-member-${member.colorIndex + 1} text-xs">
                                            ${member.name}
                                        </span>
                                    </label>
                                `;
                            }).join('') : '<p class="text-gray-500 text-xs">No team members added. Go to Team page to add some!</p>'}
                        </div>
                    </div>
                    
                    <div>
                        <label class="form-label">Priority</label>
                        <select id="task-priority" class="form-input">
                            <option value="low" ${task && task.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${task && task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${task && task.priority === 'high' ? 'selected' : ''}>High</option>
                        </select>
                         <label class="form-label mt-4">Phase</label>
                        <select id="task-phase" class="form-input">
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
                
                <div>
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" id="task-estimated-hours" class="form-input" min="0.5" step="0.5"
                           value="${task ? task.estimatedHours : 1}" required>
                </div>

                <div class="flex justify-between pt-4">
                    <div>
                        ${isEditing ? `
                            <button type="button" onclick="deleteTaskAndHideModal('${taskId}')"
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
        
        // Get selected assignees
        const assigneeCheckboxes = document.querySelectorAll('input[name="assignee"]:checked');
        const assignedTo = Array.from(assigneeCheckboxes).map(cb => cb.value);
        
        const formData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignedTo: assignedTo, // Array of member IDs
            priority: document.getElementById('task-priority').value,
            startDate: new Date(document.getElementById('task-start').value),
            endDate: new Date(document.getElementById('task-end').value),
            status: document.getElementById('task-status').value,
            estimatedHours: parseFloat(document.getElementById('task-estimated-hours').value),
            phase: document.getElementById('task-phase').value
        };
        
        if (isEditing) {
            updateTask(taskId, formData);
            showMessage('Task Updated', 'Task details updated successfully.', 'alert');
        } else {
            createTask(formData);
            showMessage('Task Created', 'New task created successfully.', 'alert');
        }
        
        hideTaskModal();
        
        // Refresh views
        if (app.currentPage === 'calendar') {
            renderCalendar();
            renderTasks(); // If tasks were displayed on AI Assistant page, refresh
        }
        updateTeamStats();
    });
}

// Helper function to delete task and hide modal in one call
function deleteTaskAndHideModal(taskId) {
    showMessage('Confirm Deletion', 'Are you sure you want to delete this task? This action cannot be undone.', 'confirm', () => {
        deleteTask(taskId);
        hideTaskModal();
        showMessage('Task Deleted', 'Task deleted successfully.', 'alert');
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
    if (!date) return '';
    const d = new Date(date);
    // Ensure correct timezone offset handling for datetime-local input
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
    if (!date) return '';
    const d = new Date(date);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${hours}:${minutes}`;
}

// Parse duration (placeholder - `parseInt` is used directly where needed)
function parseDuration(duration) {
    // This function is not strictly needed as duration is already parsed as int.
    // Kept as placeholder if more complex parsing is ever required.
    return parseInt(duration);
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
        projectIdea: app.projectIdea
    };
    
    // Dates are stored as ISO strings by JSON.stringify
    localStorage.setItem('hackmanagerData', JSON.stringify(dataToSave));
}

/**
 * Loads saved application state from local storage.
 * Converts date strings back to Date objects and handles legacy data formats.
 */
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
                // Convert date strings back to Date objects and migrate assignedTo to array
                app.allTasks.forEach(task => {
                    if (task.startDate) task.startDate = new Date(task.startDate);
                    if (task.endDate) task.endDate = new Date(task.endDate);
                    
                    // Migrate single assignedTo string to array format for multiple assignees
                    if (!Array.isArray(task.assignedTo)) {
                        task.assignedTo = task.assignedTo ? [task.assignedTo] : [];
                    }
                });
            }
            
            if (parsed.projectIdea) {
                app.projectIdea = parsed.projectIdea;
            }
            
            // Update UI with loaded data
            if (elements.hackathonName) elements.hackathonName.value = app.hackathonSettings.name || '';
            if (elements.startDate && app.hackathonSettings.startDate) {
                // Use formatDateTimeLocal for correct display in datetime-local input
                elements.startDate.value = formatDateTimeLocal(app.hackathonSettings.startDate);
            }
            if (elements.duration) elements.duration.value = app.hackathonSettings.duration || '';
            if (elements.projectIdeaInput) elements.projectIdeaInput.value = app.projectIdea || '';
            
        } catch (error) {
            console.error('Error loading data from local storage:', error);
            // Optionally, clear corrupted data
            // localStorage.removeItem('hackmanagerData');
            // showMessage('Data Load Error', 'Failed to load saved data. Your data might be corrupted. Application has been reset.', 'alert');
        }
    }
}

/**
 * Clears all stored application data from local storage and resets the app state.
 * Uses a custom confirm modal instead of browser's `confirm`.
 */
function clearLocalStorage() {
    showMessage('Confirm Clear All Data', 'Are you sure you want to clear ALL data and reset the application? This action cannot be undone.', 'confirm', () => {
        // Clear all stored data
        localStorage.removeItem('hackmanagerData');
        // Clear all API keys and selected provider/endpoint
        ['groq', 'openai', 'anthropic', 'google', 'cohere', 'other'].forEach(provider => {
            localStorage.removeItem(`${provider}_api_key`);
            localStorage.removeItem(`${provider}_model`); // Clear specific model too
            localStorage.removeItem(`${provider}_endpoint`);
        });
        localStorage.removeItem('ai_provider'); // General AI provider selection
        localStorage.removeItem('hasSeenOnboarding'); // Reset onboarding

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
        app.chatHistory = []; // Clear chat history too
        
        // Clear form inputs
        if (elements.hackathonName) elements.hackathonName.value = '';
        if (elements.startDate) elements.startDate.value = '';
        if (elements.duration) elements.duration.value = '48';
        if (elements.projectIdeaInput) elements.projectIdeaInput.value = '';
        
        // Clear API key input
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) apiKeyInput.value = '';
        
        // Clear endpoint input
        const apiEndpointInput = document.getElementById('api-endpoint');
        if (apiEndpointInput) apiEndpointInput.value = '';
        
        // Reset provider selection and hide/show relevant fields
        const providerSelect = document.getElementById('ai-provider');
        if (providerSelect) providerSelect.value = 'groq'; // Default to Groq again
        toggleApiKeyInput('groq'); // Re-run logic to show/hide sections correctly
        
        // Clear AI response display
        if (elements.aiResponse) {
            elements.aiResponse.innerHTML = '';
            elements.aiResponse.classList.add('hidden');
        }

        // Clear chat history display
        if (elements.chatHistory) {
            elements.chatHistory.innerHTML = '';
        }
        
        // Update UI components that rely on app state
        renderTeamMembers();
        updateTeamStats();
        initializeCalendar(); // Re-initialize calendar as data is cleared

        showMessage('All Data Cleared', 'All application data has been cleared successfully. The application has been reset.', 'alert', () => {
            showPage('settings'); // Redirect to settings page after reset
        });
    });
}

// ========== Export/Import Functions (Continued from previous snippets) ==========

// Export data (implementation provided in previous section)
// function exportData() { ... }

// Import data (implementation provided and refined above in handleImportData)
// function importData(jsonData) { ... }
