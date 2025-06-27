// Global application state
const app = {
    currentPage: 'onboarding', // Start on the onboarding page
    onboardingStep: 0, // 0: Hackathon Details Form, 1: Team Members, 2: Project Idea Chat
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
    chatHistory: { // Separate chat histories for onboarding steps and general chat
        onboarding1: [], // For AI chat during project idea (Step 2 now)
        general: [] // For post-onboarding AI chat
    }
};

// Element references (cached for performance)
const elements = {};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Cache common DOM elements
    elements.pages = document.querySelectorAll('.page');
    elements.navLinks = document.querySelectorAll('.nav-link');
    
    // Onboarding specific elements
    elements.onboardingContainer = document.getElementById('onboarding-container');
    elements.onboardingVisualSidebar = document.getElementById('onboarding-visual-sidebar');
    elements.onboardingSteps = document.querySelectorAll('.onboarding-step');
    elements.onboardingContentArea = document.getElementById('onboarding-content-area');
    elements.onboardingSections = document.querySelectorAll('.onboarding-section');

    // Onboarding Step 0 (Hackathon Details - now the first step)
    elements.onboardingHackathonNameInput = document.getElementById('onboarding-hackathon-name');
    elements.onboardingStartDateInput = document.getElementById('onboarding-start-date');
    elements.onboardingDurationInput = document.getElementById('onboarding-duration');
    elements.onboardingHackathonForm = document.getElementById('onboarding-hackathon-form'); // This form is now for step 0

    // Onboarding Step 1 (Team Details - now the second step)
    elements.onboardingTeamDetailsStep = document.getElementById('onboarding-team-details-step'); // Get the element for step 1
    elements.onboardingTeamList = document.getElementById('onboarding-team-list');
    elements.onboardingMemberNameInput = document.getElementById('onboarding-member-name');
    elements.onboardingSleepStartInput = document.getElementById('onboarding-sleep-start');
    elements.onboardingSleepEndInput = document.getElementById('onboarding-sleep-end');
    elements.onboardingSkillsInput = document.getElementById('onboarding-skills');
    elements.onboardingAddMemberForm = document.getElementById('onboarding-add-member-form');

    // Onboarding Step 2 (Project Idea Chat - now the third step)
    elements.onboardingProjectIdeaStep = document.getElementById('onboarding-project-idea-step'); // Get the element for step 2
    elements.onboardingChatHistory1 = document.getElementById('onboarding-chat-history-1');
    elements.onboardingChatInput1 = document.getElementById('onboarding-chat-input-1');
    elements.onboardingChatForm1 = document.getElementById('onboarding-chat-form-1');
    elements.onboardingProjectIdeaInput = document.getElementById('onboarding-project-idea-input'); // This is for main settings page, not onboarding chat

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
    
    loadFromLocalStorage(); // Load saved data
    setupEventListeners(); // Attach all event listeners
    initializeUI(); // Set up initial UI state

    // Decide whether to show onboarding or main app
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    // Onboarding is considered incomplete if essential settings or team members are missing
    if (!hasSeenOnboarding || app.hackathonSettings.name === '' || !app.hackathonSettings.startDate || !app.hackathonSettings.duration || app.teamMembers.length === 0 || app.projectIdea === '') {
        app.currentPage = 'onboarding'; // Explicitly set current page to onboarding
        showPage('onboarding');
        renderOnboardingCurrentStep(); // Start the onboarding flow
    } else {
        // If onboarding completed, show the dashboard
        app.currentPage = 'dashboard';
        showPage('dashboard');
    }
});

// ========== UI & Navigation Functions ==========

/**
 * Shows a specific page in the application.
 * Hides all other pages and activates the corresponding navigation link.
 * Properly manages visibility of onboarding container and main sidebar.
 * @param {string} pageId - The ID of the page to show (e.g., 'dashboard', 'calendar', 'onboarding').
 */
function showPage(pageId) {
    app.currentPage = pageId;

    // Hide all main app pages
    elements.pages.forEach(page => {
        page.classList.add('hidden');
    });

    // Hide onboarding container by default
    elements.onboardingContainer.classList.add('hidden');

    // Deactivate all nav links
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
    });

    if (pageId === 'onboarding') {
        elements.onboardingContainer.classList.remove('hidden');
        elements.mainSidebar.classList.add('-translate-x-full', 'lg:hidden'); // Fully hide sidebar on mobile, completely hide on larger screens
        elements.sidebarOverlay.classList.add('hidden'); // Ensure overlay is hidden
    } else {
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

        elements.mainSidebar.classList.remove('-translate-x-full', 'lg:hidden'); // Show sidebar (and ensure it's visible on lg)
        elements.mainSidebar.classList.add('lg:translate-x-0'); // Ensure it slides in on larger screens if it was hidden
        elements.sidebarOverlay.classList.add('hidden'); // Hide overlay if it was open from mobile sidebar
    }

    // Perform page-specific rendering
    if (pageId === 'calendar') {
        initializeCalendar();
        renderCalendar();
    } else if (pageId === 'team') {
        renderTeamMembers();
    } else if (pageId === 'dashboard') {
        displayChatHistory('general'); // Display general chat history on dashboard
        if (app.allTasks.length > 0) {
            displayGeneratedTasks(app.allTasks); // Display summary of generated tasks
        } else {
            elements.dashboardContent.innerHTML = `<p class="text-gray-500">No tasks generated yet. Start chatting with AI to plan your hackathon!</p>`;
        }
    }
    saveToLocalStorage(); // Save current page
}

/**
 * Initializes UI components and renders initial states based on app data.
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
    
    // Ensure onboarding inputs are pre-filled if data exists
    if (elements.onboardingHackathonNameInput) elements.onboardingHackathonNameInput.value = app.hackathonSettings.name || '';
    if (elements.onboardingStartDateInput && app.hackathonSettings.startDate) {
        elements.onboardingStartDateInput.value = formatDateTimeLocal(app.hackathonSettings.startDate);
    }
    if (elements.onboardingDurationInput) elements.onboardingDurationInput.value = app.hackathonSettings.duration || '48';
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

    // Onboarding Hackathon Details Form (Step 0)
    // This is now the first step, handling name, date, duration
    if (elements.onboardingHackathonForm) {
        elements.onboardingHackathonForm.addEventListener('submit', handleOnboardingHackathonDetailsSubmit);
    }

    // Onboarding Team Member Form (Step 1)
    if (elements.onboardingAddMemberForm) {
        elements.onboardingAddMemberForm.addEventListener('submit', handleOnboardingAddMember);
    }

    // Onboarding Chat Form (Project Idea - Step 2)
    if (elements.onboardingChatForm1) {
        elements.onboardingChatForm1.addEventListener('submit', handleOnboardingChat1Submit);
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


// ========== Onboarding Functions ==========

/**
 * Renders the current step of the onboarding process.
 * Manages which onboarding section is visible and updates the visual sidebar.
 */
function renderOnboardingCurrentStep() {
    // Hide all onboarding sections
    elements.onboardingSections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('flex'); // Ensure flex is removed if hidden
    });

    // Show the current onboarding section
    let currentSection;
    if (app.onboardingStep === 0) {
        currentSection = document.getElementById('onboarding-hackathon-details-step');
        // Pre-fill hackathon form if data exists
        elements.onboardingHackathonNameInput.value = app.hackathonSettings.name || '';
        elements.onboardingStartDateInput.value = app.hackathonSettings.startDate ? formatDateTimeLocal(app.hackathonSettings.startDate) : '';
        elements.onboardingDurationInput.value = app.hackathonSettings.duration || '48';
        elements.onboardingHackathonNameInput.focus(); // Focus on the first input
    } else if (app.onboardingStep === 1) {
        currentSection = document.getElementById('onboarding-team-details-step');
        renderOnboardingTeamMembers(); // Render the team list for onboarding
        elements.onboardingMemberNameInput.focus();
    } else if (app.onboardingStep === 2) {
        currentSection = document.getElementById('onboarding-project-idea-step');
        // Initial AI prompt for project idea, only if chat history for this step is empty
        if (app.chatHistory.onboarding1.length === 0) {
            app.chatHistory.onboarding1.push({ role: 'ai', content: 'Great! Now tell me, what is your project idea for this hackathon? I will use this to generate an initial task plan.' });
        }
        displayChatHistory('onboarding1'); // Display chat for this step
        elements.onboardingChatInput1.focus();
    }

    if (currentSection) {
        currentSection.classList.remove('hidden');
        currentSection.classList.add('flex'); // Ensure it uses flex for internal layout
    }

    updateOnboardingVisualSteps(); // Update the visual sidebar
}

/**
 * Updates the visual indicators in the onboarding sidebar.
 */
function updateOnboardingVisualSteps() {
    elements.onboardingSteps.forEach((stepEl, index) => {
        if (index === app.onboardingStep) {
            stepEl.classList.add('active');
            stepEl.querySelector('.onboarding-step-icon').classList.remove('bg-gray-600', 'text-gray-300');
            stepEl.querySelector('.onboarding-step-icon').classList.add('bg-blue-600', 'text-white');
            stepEl.querySelector('.onboarding-step-text').classList.remove('text-gray-400');
            stepEl.querySelector('.onboarding-step-text').classList.add('text-white', 'font-semibold');
        } else {
            stepEl.classList.remove('active');
            stepEl.querySelector('.onboarding-step-icon').classList.remove('bg-blue-600', 'text-white');
            stepEl.querySelector('.onboarding-step-icon').classList.add('bg-gray-600', 'text-gray-300');
            stepEl.querySelector('.onboarding-step-text').classList.remove('text-white', 'font-semibold');
            stepEl.querySelector('.onboarding-step-text').classList.add('text-gray-400');
        }
    });
}


/**
 * Handles submission of the onboarding hackathon details form (now step 0).
 * @param {Event} event
 */
function handleOnboardingHackathonDetailsSubmit(event) {
    event.preventDefault();

    const name = elements.onboardingHackathonNameInput.value.trim();
    const startDate = elements.onboardingStartDateInput.value;
    const duration = parseInt(elements.onboardingDurationInput.value);

    if (!name || !startDate || isNaN(duration) || duration <= 0) {
        showMessage('Missing Information', 'Please fill in all hackathon details: Name, Start Date, and Duration.', 'alert');
        return;
    }
    
    app.hackathonSettings.name = name;
    app.hackathonSettings.startDate = new Date(startDate);
    app.hackathonSettings.duration = duration;
    saveToLocalStorage();

    app.onboardingStep = 1; // Move to the next step (Team Members)
    renderOnboardingCurrentStep();
}

/**
 * Renders the list of team members in the onboarding team details step.
 */
function renderOnboardingTeamMembers() {
    if (!elements.onboardingTeamList) return;

    elements.onboardingTeamList.innerHTML = '';
    if (app.teamMembers.length === 0) {
        elements.onboardingTeamList.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">No members added yet.</p>';
        elements.onboardingTeamList.classList.remove('p-4'); // Remove padding if empty
        elements.onboardingTeamList.classList.remove('bg-gray-700');
    } else {
        elements.onboardingTeamList.classList.add('p-4');
        elements.onboardingTeamList.classList.add('bg-gray-700');
        app.teamMembers.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = `flex items-center justify-between p-2 bg-gray-800 rounded-md shadow-sm`;
            memberDiv.innerHTML = `
                <span class="team-badge team-member-${(member.colorIndex % 8) + 1}">${member.name}</span>
                <div class="text-sm text-gray-400">Sleep: ${member.sleepStart}-${member.sleepEnd}</div>
                <button type="button" onclick="removeOnboardingTeamMember('${member.id}')" class="text-red-400 hover:text-red-500 transition-colors">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            elements.onboardingTeamList.appendChild(memberDiv);
        });
    }
}

/**
 * Handles adding a team member during onboarding.
 * @param {Event} event
 */
function handleOnboardingAddMember(event) {
    event.preventDefault();
    const nameInput = elements.onboardingMemberNameInput;
    const sleepStartInput = elements.onboardingSleepStartInput;
    const sleepEndInput = elements.onboardingSleepEndInput;
    const skillsInput = elements.onboardingSkillsInput;

    const newMember = {
        id: generateId(),
        name: nameInput.value,
        sleepStart: sleepStartInput.value,
        sleepEnd: sleepEndInput.value,
        skills: skillsInput.value.split(',').map(s => s.trim()).filter(s => s) || [],
        colorIndex: app.teamMembers.length // Assign a color based on current length
    };
    app.teamMembers.push(newMember);
    saveToLocalStorage();
    renderOnboardingTeamMembers(); // Re-render to show new member
    
    // Clear form fields
    nameInput.value = '';
    skillsInput.value = '';
    nameInput.focus();
}

/**
 * Removes a team member during onboarding.
 * @param {string} memberId
 */
function removeOnboardingTeamMember(memberId) {
    app.teamMembers = app.teamMembers.filter(member => member.id !== memberId);
    saveToLocalStorage();
    renderOnboardingTeamMembers(); // Re-render to show updated list
}

/**
 * Handles submission of the onboarding project idea chat form (now step 2).
 * @param {Event} event
 */
async function handleOnboardingChat1Submit(event) {
    event.preventDefault();
    const userMessage = elements.onboardingChatInput1.value.trim();

    if (!userMessage) return;

    app.chatHistory.onboarding1.push({ role: 'user', content: userMessage });
    displayChatHistory('onboarding1');
    elements.onboardingChatInput1.value = ''; // Clear input field
    elements.onboardingChatInput1.disabled = true; // Disable input while AI is thinking

    app.projectIdea = userMessage; // Save project idea
    saveToLocalStorage();

    addMessageToChatHistory('onboarding1', 'ai', 'Thinking and generating tasks... This might take a moment. Please wait.');
    scrollChatToBottom(elements.onboardingChatHistory1);

    try {
        const progressCallback = (progress, message) => {
            // Update the last AI message with progress
            const lastMessageDiv = elements.onboardingChatHistory1.lastChild;
            if (lastMessageDiv && lastMessageDiv.dataset.role === 'ai') {
                lastMessageDiv.innerHTML = `<strong>AI:</strong> ${message} (${progress}%)`;
                scrollChatToBottom(elements.onboardingChatHistory1);
            } else {
                addMessageToChatHistory('onboarding1', 'ai', `${message} (${progress}%)`);
            }
        };

        const selectedProvider = elements.aiProviderSelect.value;
        app.allTasks = await generateTasksWithAI(userMessage, selectedProvider, progressCallback);
        saveToLocalStorage();
        
        // Remove progress message and add final AI message
        const finalAIMessage = app.allTasks.length > 0
            ? `Fantastic! I've generated ${app.allTasks.length} initial tasks for your "${app.hackathonSettings.name}" project. You can review and manage them in the Calendar section.`
            : `I couldn't generate tasks based on that. Please try rephrasing your project idea or check your settings.`;
        
        // Replace last AI message or add a new one
        const lastMessageDiv = elements.onboardingChatHistory1.lastChild;
        if (lastMessageDiv && lastMessageDiv.dataset.role === 'ai') {
            lastMessageDiv.innerHTML = `<strong>AI:</strong> ${finalAIMessage}`;
        } else {
            addMessageToChatHistory('onboarding1', 'ai', finalAIMessage);
        }

        scrollChatToBottom(elements.onboardingChatHistory1);

        // Transition to dashboard after AI response
        setTimeout(() => {
            completeOnboarding();
        }, 3000); // Give user time to read AI response
        
    } catch (error) {
        console.error('Error generating tasks during onboarding:', error);
        addMessageToChatHistory('onboarding1', 'ai', `Oops! I encountered an error: ${error.message}. Please check your API key in Settings or try again.`);
        scrollChatToBottom(elements.onboardingChatHistory1);
    } finally {
        elements.onboardingChatInput1.disabled = false; // Re-enable input
    }
}

/**
 * Completes the onboarding process, hides the onboarding container, and shows the main app.
 */
function completeOnboarding() {
    localStorage.setItem('hasSeenOnboarding', 'true');
    showPage('dashboard'); // Redirect to dashboard page
    updateTeamStats(); // Ensure stats are up-to-date for dashboard
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
                <input type="text" id="member-name" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500" value="${member ? member.name : ''}" required>
            </div>
            <div>
                <label for="member-sleep-start" class="form-label">Sleep Start (24h format)</label>
                <input type="time" id="member-sleep-start" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500" value="${member ? member.sleepStart : '23:00'}" required>
            </div>
            <div>
                <label for="member-sleep-end" class="form-label">Sleep End (24h format)</label>
                <input type="time" id="member-sleep-end" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500" value="${member ? member.sleepEnd : '07:00'}" required>
            </div>
            <div>
                <label for="member-skills" class="form-label">Skills (comma-separated, e.g., Frontend, Backend, UI/UX)</label>
                <input type="text" id="member-skills" class="form-input bg-gray-700 border-gray-600 focus:border-blue-500" value="${member && member.skills ? member.skills.join(', ') : ''}">
            </div>
            <div class="flex justify-end gap-3 pt-4">
                ${isEditing ? `
                    <button type="button" onclick="deleteTeamMember('${memberId}')" class="btn bg-red-600 hover:bg-red-700">Delete Member</button>
                ` : ''}
                <button type="submit" class="btn">${isEditing ? 'Update Member' : 'Add Member'}</button>
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

// ========== AI Assistant Functions (Post-Onboarding) ==========

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
                    "assignedTo": ["member_id1", "member_id2"], // Array of member IDs
                    "status": "Not Started|In Progress|Completed|Blocked"
                }
            ]
        }
        
        If no task modification is requested, provide a conversational response.`;
        
        // Use a general call to Gemini API, requesting JSON if specific keywords are present
        const responseText = await callGeminiAPI(prompt); // No explicit schema here, will check response format

        let aiContent = responseText;
        let actionHandled = false;

        try {
            const parsedResponse = JSON.parse(responseText);
            if (parsedResponse.action === 'update_tasks' && Array.isArray(parsedResponse.tasks)) {
                parsedResponse.tasks.forEach(taskData => {
                    const existingTask = app.allTasks.find(t => t.id === taskData.id);
                    if (existingTask) {
                        // Update existing task
                        updateTask(taskData.id, taskData);
                        aiContent = `Updated task: "${taskData.title}".`;
                    } else {
                        // Create new task
                        const assignedToIds = taskData.assignedTo.map(name => {
                            const member = app.teamMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
                            return member ? member.id : null;
                        }).filter(id => id !== null);

                        const newTask = {
                            ...taskData,
                            id: generateId(),
                            assignedTo: assignedToIds,
                            startDate: new Date(), // Default to now if not provided
                            endDate: addHours(new Date(), taskData.estimatedHours || 1), // Default to 1 hour
                        };
                        createTask(newTask);
                        aiContent = `Added new task: "${newTask.title}".`;
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
 * Displays the chat history messages in the specified chat container.
 * @param {'onboarding1'|'general'} chatType - The type of chat history to display.
 */
function displayChatHistory(chatType) {
    let chatHistoryContainer;
    let currentChatHistory;

    if (chatType === 'onboarding1') {
        chatHistoryContainer = elements.onboardingChatHistory1;
        currentChatHistory = app.chatHistory.onboarding1;
    } else if (chatType === 'general') {
        chatHistoryContainer = elements.dashboardContent; // Dashboard content now acts as general chat history
        currentChatHistory = app.chatHistory.general;
    } else {
        console.error('Invalid chatType:', chatType);
        return;
    }

    if (!chatHistoryContainer) return;

    chatHistoryContainer.innerHTML = ''; // Clear existing messages
    currentChatHistory.forEach(msg => {
        addMessageToChatHistory(chatType, msg.role, msg.content, false); // Add without scrolling initially
    });
    // Scroll to bottom after all messages are added
    scrollChatToBottom(chatHistoryContainer);
}

/**
 * Adds a single message to the specified chat history and optionally scrolls to bottom.
 * @param {'onboarding1'|'general'} chatType - The type of chat history to add to.
 * @param {'user'|'ai'} role - The sender of the message.
 * @param {string} content - The message content.
 * @param {boolean} [doScroll=true] - Whether to scroll to the bottom after adding.
 */
function addMessageToChatHistory(chatType, role, content, doScroll = true) {
    let chatHistoryContainer;

    if (chatType === 'onboarding1') {
        chatHistoryContainer = elements.onboardingChatHistory1;
        app.chatHistory.onboarding1.push({ role, content });
    } else if (chatType === 'general') {
        chatHistoryContainer = elements.dashboardContent;
        app.chatHistory.general.push({ role, content });
    } else {
        console.error('Invalid chatType for adding message:', chatType);
        return;
    }

    if (!chatHistoryContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg mb-2 ${role === 'user' ? 'bg-blue-700 self-end text-right ml-auto text-white' : 'bg-gray-700 self-start text-left mr-auto text-gray-100'}`;
    messageDiv.style.maxWidth = '80%';
    messageDiv.dataset.role = role; // Custom attribute to easily identify AI messages

    messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'AI'}:</strong> ${content}`;
    chatHistoryContainer.appendChild(messageDiv);

    if (doScroll) {
        scrollChatToBottom(chatHistoryContainer);
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
        showMessage('No Team Members', 'Please add at least one team member in the Team section to enable AI task assignment. Falling back to basic task generation.', 'alert');
        return generateProjectTasks(projectIdea, updateProgress); // Fallback to local generation
    }

    const teamMembersInfo = teamMembers.map(m => {
        const skills = m.skills.length > 0 ? `Skills: [${m.skills.join(', ')}]` : 'No specific skills listed';
        return `- Name: ${m.name}, ${skills}, Sleep: ${m.sleepStart}-${m.sleepEnd}`;
    }).join('\n');

    const prompt = `You are a hackathon project manager. Generate a detailed task breakdown for a ${totalHours}-hour hackathon project.

Project Idea: ${projectIdea}

Team Members with Skills and Sleep Schedules:
${teamMembersInfo}

Hackathon Start Date: ${startDate.toISOString()}
Hackathon Duration: ${totalHours} hours

IMPORTANT CONSTRAINTS:
1. Assign tasks to team members by their full name. Prioritize members whose skills best match the task. If multiple members have relevant skills, distribute the workload evenly. If no specific skill match, assign based on general availability.
2. Ensure task start and end times are realistic and do NOT overlap with a team member's sleep hours (${teamMembersInfo}).
3. Ensure task start and end times are within the hackathon's overall duration (${totalHours} hours from the start date).
4. Use 24-hour time format (HH:MM).
5. The total estimated hours for all tasks combined should be close to the hackathon duration (${totalHours} hours).
6. Provide a detailed description for each task.

Generate a comprehensive list of tasks in JSON format. Each task object should have the following properties:
- "title": string - Clear, action-oriented task name (e.g., "Set up Backend API").
- "description": string - Detailed description of what needs to be done.
- "phase": string - One of "planning", "design", "development", "integration", "testing", "presentation".
- "estimatedHours": number - Realistic time estimate in hours (integer, e.g., 4, 8, 2.5).
- "priority": string - "high", "medium", or "low".
- "assignedTo": array<string> - An array of the FULL NAMES of the team members assigned to this task (e.g., ["Alice", "Bob"]). Ensure names match exactly one of the provided team member names.
- "startDate": string - The proposed start date and time for the task in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ). This must respect the hackathon start and team member sleep schedules.
- "endDate": string - The proposed end date and time for the task in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ). This must respect the hackathon end and team member sleep schedules.

Allocate time wisely for phases, roughly as percentages of total project hours:
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
                max_tokens: 4000, // Increased max_tokens for more detailed responses
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
                max_tokens: 4000,
                response_format: { type: "json_object" }
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
            apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
            // API_KEY is handled by the Canvas environment automatically
            payload = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4000,
                    responseMimeType: "application/json",
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
                                "assignedTo": { "type": "ARRAY", "items": { "type": "STRING" } }, // Array of strings
                                "startDate": { "type": "STRING", "format": "date-time" }, // ISO 8601 string
                                "endDate": { "type": "STRING", "format": "date-time" } // ISO 8601 string
                            },
                            required: ["title", "description", "phase", "estimatedHours", "priority", "assignedTo", "startDate", "endDate"]
                        }
                    }
                }
            };
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
                max_tokens: 4000,
                response_format: { type: "json_object" }
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
        
        let tasks;
        try {
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
        const processedTasks = tasks.map((task) => {
            // Convert assignedTo names to IDs
            const assignedToIds = Array.isArray(task.assignedTo)
                ? task.assignedTo.map(name => {
                    const member = teamMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
                    return member ? member.id : null;
                }).filter(id => id !== null)
                : [];

            if (assignedToIds.length === 0 && teamMembers.length > 0) {
                // If AI couldn't assign, or assigned to non-existent member, assign to a random member for now
                console.warn(`AI failed to assign task "${task.title}". Assigning to random available member.`);
                assignedToIds.push(teamMembers[Math.floor(Math.random() * teamMembers.length)].id);
            }
            if (assignedToIds.length === 0) {
                 console.warn(`Task "${task.title}" could not be assigned as no team members exist.`);
            }

            // Convert date strings to Date objects
            let taskStart = new Date(task.startDate);
            let taskEnd = new Date(task.endDate);

            // Ensure start and end dates are valid, if not, assign defaults
            if (isNaN(taskStart.getTime())) {
                taskStart = new Date(startDate);
                console.warn(`Invalid start date for task "${task.title}". Defaulting to hackathon start.`);
            }
            if (isNaN(taskEnd.getTime())) {
                taskEnd = addHours(taskStart, task.estimatedHours || 1);
                console.warn(`Invalid end date for task "${task.title}". Defaulting to calculated end.`);
            }

            // Ensure tasks respect sleep schedules and hackathon duration
            // This is complex and might need multiple iterations of adjustment or a more sophisticated scheduler
            // For now, we'll do a basic check and adjust.
            const hackathonEndDate = calculateEndDate(startDate, totalHours);
            if (taskStart < startDate) taskStart = new Date(startDate);
            if (taskEnd > hackathonEndDate) taskEnd = new Date(hackathonEndDate);

            // Basic check for overlap with assigned members' sleep schedules.
            // If overlapping, shift the task forward to the next available working hour.
            if (assignedToIds.length > 0) {
                const assignedMember = teamMembers.find(m => m.id === assignedToIds[0]); // Just check first assigned for simplicity
                if (assignedMember) {
                    let adjustedTaskStart = new Date(taskStart);
                    let initialHours = task.estimatedHours || 1;
                    let currentAdjustedEnd = addHours(adjustedTaskStart, initialHours);
                    let attempts = 0;
                    const maxAttempts = totalHours * 2; // Prevent infinite loop

                    while ((isDuringSleep(adjustedTaskStart, assignedMember) || isDuringSleep(currentAdjustedEnd, assignedMember)) && attempts < maxAttempts) {
                        adjustedTaskStart.setMinutes(adjustedTaskStart.getMinutes() + 30); // Advance by 30 mins
                        currentAdjustedEnd = addHours(adjustedTaskStart, initialHours);
                        attempts++;

                        // If pushed beyond hackathon end, clip it
                        if (currentAdjustedEnd > hackathonEndDate) {
                            adjustedTaskStart = new Date(hackathonEndDate); // Clip start
                            currentAdjustedEnd = new Date(hackathonEndDate); // Clip end
                            initialHours = (currentAdjustedEnd.getTime() - adjustedTaskStart.getTime()) / (1000 * 60 * 60);
                            task.estimatedHours = parseFloat(initialHours.toFixed(1));
                            break;
                        }
                    }
                    taskStart = adjustedTaskStart;
                    taskEnd = currentAdjustedEnd;
                }
            }


            return {
                id: generateId(),
                title: task.title || 'Untitled Task',
                description: task.description || '',
                phase: task.phase || 'development',
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: task.estimatedHours || 1,
                priority: task.priority || 'medium',
                assignedTo: assignedToIds, // Store as array of IDs
                status: task.status || 'Not Started'
            };
        }).filter(task => task !== null); // Filter out any null tasks if assignment failed due to no members

        processedTasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()); // Sort by start date
        
        return processedTasks;
        
    } catch (error) {
        console.error(`API error for ${provider}:`, error);
        throw error; // Re-throw to be caught by the calling function (e.g., handleOnboardingChat1Submit)
    }
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
        showMessage('No Team Members', 'Please add at least one team member in the Team section to generate tasks. Tasks will not be assigned.', 'alert');
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
    
    let currentTimeOffsetHours = 0; // Tracks elapsed time from hackathon start for task scheduling
    
    /**
     * Helper function to assign team members based on skills and availability.
     * @param {string} taskPhase - The phase of the task.
     * @param {string} taskTitle - The title of the task.
     * @returns {string} The ID of the assigned team member.
     */
    const assignMember = (taskPhase, taskTitle) => {
        if (app.teamMembers.length === 0) return []; // Return empty array if no members

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
            const assignedTaskCount = tasks.filter(t => // Use `tasks` (locally generated array)
                Array.isArray(t.assignedTo) ? t.assignedTo.includes(member.id) : t.assignedTo === member.id
            ).length;
            score -= assignedTaskCount * 0.5; // Reduce score for heavily loaded members
            
            return { member, score };
        });
        
        memberScores.sort((a, b) => b.score - a.score);
        
        if (memberScores.length > 0) {
            // Simple rotation if scores are very close to distribute
            const topScore = memberScores[0].score;
            const topScorers = memberScores.filter(ms => ms.score >= topScore - 1).map(ms => ms.member);
            return [topScorers[tasks.length % topScorers.length].id];
        }
        
        return [app.teamMembers[0].id]; // Fallback to first member if no criteria met, as an array
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
     * @param {string[]} assignedMemberIds - The IDs of the assigned members.
     * @param {Date} hackathonStartDate - The absolute start date of the hackathon.
     * @param {number} totalHackathonHours - The total duration of the hackathon.
     * @returns {Date} The adjusted start time.
     */
    const getNextAvailableTime = (proposedTime, assignedMemberIds, hackathonStartDate, totalHackathonHours) => {
        // For simplicity, we'll only consider the first assigned member's sleep schedule for time adjustment
        const assignedMember = assignedMemberIds.length > 0 ? app.teamMembers.find(m => m.id === assignedMemberIds[0]) : null;
        if (!assignedMember) return proposedTime;

        let adjustedTime = new Date(proposedTime);
        const hackathonEndTime = calculateEndDate(hackathonStartDate, totalHackathonHours);

        if (adjustedTime < hackathonStartDate) {
            adjustedTime = new Date(hackathonStartDate);
        }
        
        let attempts = 0;
        const maxAttempts = totalHackathonHours * 2; // Prevent infinite loop
        
        while (isDuringSleep(adjustedTime, assignedMember) && attempts < maxAttempts) {
            adjustedTime.setMinutes(adjustedTime.getMinutes() + 30);
            if (adjustedTime > hackathonEndTime) {
                adjustedTime = new Date(hackathonEndTime);
                break;
            }
            attempts++;
        }
        
        return adjustedTime;
    };
    
    if (updateProgress) updateProgress(40, 'Generating planning tasks...');
    
    // Phase 1: Planning & Research
    const planningHours = Math.floor(totalHours * timeAllocation.planning);
    let currentTaskActualStart = new Date(startDate); // Absolute start time for the current task

    if (planningHours > 0) {
        let task1MemberIds = assignMember("planning", "Team Kickoff & Brainstorming");
        let task1Start = getNextAvailableTime(currentTaskActualStart, task1MemberIds, startDate, totalHours);
        let task1Hours = Math.min(2, planningHours); // Cap initial task to 2 hours
        let task1End = addHours(task1Start, task1Hours);
        
        tasks.push({
            id: generateId(),
            title: "Team Kickoff & Brainstorming",
            description: "Initial team meeting to discuss the project idea, establish goals, and align on the vision",
            phase: "planning",
            startDate: task1Start,
            endDate: task1End,
            estimatedHours: task1Hours,
            priority: "high",
            assignedTo: task1MemberIds,
            status: 'Not Started'
        });
        currentTaskActualStart = task1End;

        if (planningHours - task1Hours > 0) {
            let task2MemberIds = assignMember("planning", "Technical Research & Feasibility Study");
            let task2Start = getNextAvailableTime(currentTaskActualStart, task2MemberIds, startDate, totalHours);
            let task2Hours = planningHours - task1Hours;
            let task2End = addHours(task2Start, task2Hours);
            
            tasks.push({
                id: generateId(),
                title: "Technical Research & Feasibility Study",
                description: "Research technical requirements, APIs, libraries, and tools needed for the project",
                phase: "planning",
                startDate: task2Start,
                endDate: task2End,
                estimatedHours: task2Hours,
                priority: "high",
                assignedTo: task2MemberIds,
                status: 'Not Started'
            });
            currentTaskActualStart = task2End;
        }
    }
    
    if (updateProgress) updateProgress(50, 'Creating design and architecture tasks...');
    
    // Phase 2: Design & Architecture
    const designHours = Math.floor(totalHours * timeAllocation.design);
    if (designHours > 0) {
        let taskMemberIds = assignMember("design", "System Architecture Design");
        let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
        let taskHours = Math.floor(designHours * 0.4);
        let taskEnd = addHours(taskStart, taskHours);

        tasks.push({
            id: generateId(),
            title: "System Architecture Design",
            description: "Create high-level system architecture, define components, and plan data flow",
            phase: "design",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: taskHours,
            priority: "high",
            assignedTo: taskMemberIds,
            status: 'Not Started'
        });
        currentTaskActualStart = taskEnd;

        if (designHours - taskHours > 0) {
            taskMemberIds = assignMember("design", "UI/UX Design & Wireframes");
            taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
            taskHours = designHours - taskHours;
            let currentTaskEnd = addHours(taskStart, taskHours);

            tasks.push({
                id: generateId(),
                title: "UI/UX Design & Wireframes",
                description: "Create user interface designs, wireframes, and user flow diagrams",
                phase: "design",
                startDate: taskStart,
                endDate: currentTaskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: taskMemberIds,
                status: 'Not Started'
            });
            currentTaskActualStart = currentTaskEnd;
        }
    }
    
    if (updateProgress) updateProgress(60, 'Planning development tasks...');
    
    // Phase 3: Core Development
    const devHours = Math.floor(totalHours * timeAllocation.development);
    if (devHours > 0) {
        let remainingDevHours = devHours;
        
        if (isWebApp || isMobile) {
            let taskMemberIds = assignMember("development", "Frontend Setup & Base Structure");
            let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
            let taskHours = Math.min(remainingDevHours * 0.15, 8); // Cap this task to 8 hours
            let taskEnd = addHours(taskStart, taskHours);

            tasks.push({
                id: generateId(),
                title: "Frontend Setup & Base Structure",
                description: "Set up the frontend framework, create base components, and establish project structure",
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: taskMemberIds,
                status: 'Not Started'
            });
            currentTaskActualStart = taskEnd;
            remainingDevHours -= taskHours;
            
            if (remainingDevHours > 0) {
                taskMemberIds = assignMember("development", "Implement Core UI Components");
                taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
                taskHours = Math.min(remainingDevHours * 0.25, 12); // Cap this task to 12 hours
                let currentTaskEnd = addHours(taskStart, taskHours);

                tasks.push({
                    id: generateId(),
                    title: "Implement Core UI Components",
                    description: "Build the main user interface components and pages",
                    phase: "development",
                    startDate: taskStart,
                    endDate: currentTaskEnd,
                    estimatedHours: taskHours,
                    priority: "high",
                    assignedTo: taskMemberIds,
                    status: 'Not Started'
                });
                currentTaskActualStart = currentTaskEnd;
                remainingDevHours -= taskHours;
            }
        }
        
        if (hasBackend && remainingDevHours > 0) {
            let taskMemberIds = assignMember("development", "Backend API Development");
            let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
            let taskHours = Math.min(remainingDevHours * 0.3, 16); // Cap this task to 16 hours
            let taskEnd = addHours(taskStart, taskHours);

            tasks.push({
                id: generateId(),
                title: "Backend API Development",
                description: "Set up server, create API endpoints, and implement business logic",
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: taskMemberIds,
                status: 'Not Started'
            });
            currentTaskActualStart = taskEnd;
            remainingDevHours -= taskHours;
            
            if (remainingDevHours > 0) {
                taskMemberIds = assignMember("development", "Database Design & Implementation");
                let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
                let taskHours = Math.min(remainingDevHours * 0.2, 12); // Cap this task to 12 hours
                let currentTaskEnd = addHours(taskStart, taskHours);

                tasks.push({
                    id: generateId(),
                    title: "Database Design & Implementation",
                    description: "Design database schema, set up database, and create data models",
                    phase: "development",
                    startDate: taskStart,
                    endDate: currentTaskEnd,
                    estimatedHours: taskHours,
                    priority: "high",
                    assignedTo: taskMemberIds,
                    status: 'Not Started'
                });
                currentTaskActualStart = currentTaskEnd;
                remainingDevHours -= taskHours;
            }
        }
        
        if (hasAI && remainingDevHours > 0) {
            let taskMemberIds = assignMember("development", "AI Model Development");
            let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
            let taskHours = Math.min(remainingDevHours * 0.3, 20); // Cap this task to 20 hours
            let taskEnd = addHours(taskStart, taskHours);

            tasks.push({
                id: generateId(),
                title: "AI Model Development",
                description: "Develop and train machine learning models for the project",
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "high",
                assignedTo: taskMemberIds,
                status: 'Not Started'
            });
            currentTaskActualStart = taskEnd;
            remainingDevHours -= taskHours;
        }
        
        if (remainingDevHours > 0) { // Catch-all for remaining development hours
            let taskMemberIds = assignMember("development", "Implement Remaining Core Features");
            let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
            let taskHours = remainingDevHours;
            let taskEnd = addHours(taskStart, taskHours);

            tasks.push({
                id: generateId(),
                title: "Implement Remaining Core Features",
                description: `Develop any remaining main functionality of the project based on: ${projectIdea.substring(0, Math.min(projectIdea.length, 100))}...`,
                phase: "development",
                startDate: taskStart,
                endDate: taskEnd,
                estimatedHours: taskHours,
                priority: "medium",
                assignedTo: taskMemberIds,
                status: 'Not Started'
            });
            currentTaskActualStart = taskEnd;
        }
    }
    
    if (updateProgress) updateProgress(80, 'Adding integration and testing phases...');
    
    // Phase 4: Integration
    const integrationHours = Math.floor(totalHours * timeAllocation.integration);
    if (integrationHours > 0) {
        let taskMemberIds = assignMember("integration", "System Integration");
        let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
        let taskEnd = addHours(taskStart, integrationHours);

        tasks.push({
            id: generateId(),
            title: "System Integration",
            description: "Connect all components, integrate APIs, and ensure smooth data flow",
            phase: "integration",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: integrationHours,
            priority: "medium",
            assignedTo: taskMemberIds,
            status: 'Not Started'
        });
        currentTaskActualStart = taskEnd;
    }
    
    // Phase 5: Testing & Bug Fixes
    const testingHours = Math.floor(totalHours * timeAllocation.testing);
    if (testingHours > 0) {
        let taskMemberIds = assignMember("testing", "Testing & Bug Fixes");
        let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
        let taskEnd = addHours(taskStart, testingHours);

        tasks.push({
            id: generateId(),
            title: "Testing & Bug Fixes",
            description: "Perform comprehensive testing, identify bugs, and fix critical issues",
            phase: "testing",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: testingHours,
            priority: "medium",
            assignedTo: taskMemberIds,
            status: 'Not Started'
        });
        currentTaskActualStart = taskEnd;
    }
    
    if (updateProgress) updateProgress(90, 'Finalizing presentation tasks...');
    
    // Phase 6: Presentation Preparation
    const presentationHours = Math.floor(totalHours * timeAllocation.presentation);
    if (presentationHours > 0) {
        let taskMemberIds = assignMember("presentation", "Create Demo & Presentation");
        let taskStart = getNextAvailableTime(currentTaskActualStart, taskMemberIds, startDate, totalHours);
        let taskEnd = addHours(taskStart, presentationHours);

        tasks.push({
            id: generateId(),
            title: "Create Demo & Presentation",
            description: "Prepare project demo, create presentation slides, and practice pitch",
            phase: "presentation",
            startDate: taskStart,
            endDate: taskEnd,
            estimatedHours: presentationHours,
            priority: "high",
            assignedTo: taskMemberIds,
            status: 'Not Started'
        });
        currentTaskActualStart = taskEnd;
    }

    tasks.forEach(task => {
        if (!task.status) task.status = 'Not Started';
        // Ensure start and end dates don't exceed hackathon end
        const hackathonEndDate = calculateEndDate(startDate, totalHours);
        if (task.startDate > hackathonEndDate) task.startDate = new Date(hackathonEndDate);
        if (task.endDate > hackathonEndDate) task.endDate = new Date(hackathonEndDate);
        if (task.startDate >= task.endDate) { // Ensure end date is always after start date for valid tasks
            task.endDate = addHours(task.startDate, 1); // Default to 1 hour if invalid
        }
    });

    return tasks;
}

// Display generated tasks in the UI on the Dashboard page
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
                <button onclick="exportTasks()" class="btn bg-gray-600 hover:bg-gray-700">
                    Export Tasks
                </button>
            </div>
        </div>
    `;
    
    elements.dashboardContent.innerHTML = html;
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
                localStorage.removeItem('hasSeenOnboarding'); // Reset onboarding
                // Note: API keys are not cleared by default during import.
                // If you want to import API keys, they would need to be part of the exportData structure.

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
                        onboarding1: [{ role: 'ai', content: 'Great! Now tell me, what is your project idea for this hackathon? I will use this to generate an initial task plan.' }],
                        general: []
                    };
                }
                
                // If old data format was present (onboarding0 chat), remove it and re-initialize onboarding1.
                if (app.chatHistory.onboarding0) {
                    delete app.chatHistory.onboarding0;
                    app.chatHistory.onboarding1 = [{ role: 'ai', content: 'Great! Now tell me, what is your project idea for this hackathon? I will use this to generate an initial task plan.' }];
                }

                saveToLocalStorage();
                initializeUI(); // Re-initialize UI with new data
                
                // After import, redirect to dashboard and show sidebar
                showMessage('Import Successful', 'Data imported successfully. Your application has been updated.', 'alert', () => {
                     // Ensure the correct initial page is shown after import
                    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
                    if (!hasSeenOnboarding || app.hackathonSettings.name === '' || !app.hackathonSettings.startDate || !app.hackathonSettings.duration || app.teamMembers.length === 0 || app.projectIdea === '') {
                        app.currentPage = 'onboarding';
                        showPage('onboarding');
                        renderOnboardingCurrentStep();
                    } else {
                        app.currentPage = 'dashboard';
                        showPage('dashboard');
                    }
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
    const days = Math.ceil(totalMilliseconds / (1000 * 60 * 60 * 24)) + 1;
    
    const minColumnWidth = 150;
    const totalWidth = Math.max(days * minColumnWidth, scrollContainer.offsetWidth);
    
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
    grid.style.height = `${app.hackathonSettings.duration * 80}px`;
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
    
    if (assignedMembers.length === 0) return elements;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) {
        console.warn('Invalid date for task:', task.title, task.startDate, task.endDate);
        return elements;
    }
    
    const calendarEnd = calculateEndDate(calendarStart, app.hackathonSettings.duration);
    
    if (taskEnd < calendarStart || taskStart > calendarEnd) return elements;
    
    const effectiveRenderStart = new Date(Math.max(taskStart.getTime(), calendarStart.getTime()));
    const effectiveRenderEnd = new Date(Math.min(taskEnd.getTime(), calendarEnd.getTime()));
    
    const startDayIndex = Math.floor((effectiveRenderStart.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));
    const endDayIndex = Math.floor((effectiveRenderEnd.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));

    const dayWidth = totalWidth / totalDays;

    for (let day = startDayIndex; day <= endDayIndex && day < totalDays; day++) {
        const segmentDayStart = new Date(calendarStart);
        segmentDayStart.setDate(segmentDayStart.getDate() + day);
        segmentDayStart.setHours(0, 0, 0, 0);

        const segmentDayEnd = new Date(segmentDayStart);
        segmentDayEnd.setDate(segmentDayEnd.getDate() + 1);

        const currentSegmentStart = new Date(Math.max(effectiveRenderStart.getTime(), segmentDayStart.getTime()));
        const currentSegmentEnd = new Date(Math.min(effectiveRenderEnd.getTime(), segmentDayEnd.getTime()));

        if (currentSegmentStart >= currentSegmentEnd) continue;

        const minutesFromHackathonStart = (currentSegmentStart.getTime() - calendarStart.getTime()) / (1000 * 60);
        const topPosition = (minutesFromHackathonStart / 60) * 80;

        const durationMinutes = (currentSegmentEnd.getTime() - currentSegmentStart.getTime()) / (1000 * 60);
        const height = (durationMinutes / 60) * 80;

        const taskEl = document.createElement('div');
        
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
        taskEl.style.height = `${Math.max(20, height - 2)}px`;
        taskEl.style.left = `${day * dayWidth + 2}px`;
        taskEl.style.width = `${dayWidth - 4}px`;
        taskEl.style.zIndex = '10';

        if (day === startDayIndex && day < endDayIndex) {
            taskEl.classList.add('task-multi-day-start');
        } else if (day > startDayIndex && day < endDayIndex) {
            taskEl.classList.add('task-multi-day-middle');
        } else if (day === endDayIndex && day > startDayIndex) {
            taskEl.classList.add('task-multi-day-end');
        }

        taskEl.innerHTML = `
            <div class="font-semibold truncate">${task.title}</div>
            <div class="text-xs opacity-90">${assignedMembers.map(m => m.name).join(', ')}</div>
            ${height > 30 ? `<div class="text-xs opacity-75">${formatTime(currentSegmentStart)} - ${formatTime(currentSegmentEnd)}</div>` : ''}
        `;
        
        taskEl.onclick = (e) => {
            e.stopPropagation();
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
    const scrollContainer = elements.calendarScrollContainer;
    const daysHeader = elements.calendarDaysHeader;
    const timeColumn = elements.timeColumn;
    const scrollbar = elements.calendarScrollbar;
    
    if (!scrollContainer || !daysHeader || !scrollbar || !timeColumn) return;
    
    let isUpdating = false;
    
    const syncHorizontalScroll = (source) => {
        if (isUpdating) return;
        isUpdating = true;
        
        const scrollLeft = source.scrollLeft;
        
        if (source !== scrollContainer) scrollContainer.scrollLeft = scrollLeft;
        if (source !== daysHeader) daysHeader.scrollLeft = scrollLeft;
        if (source !== scrollbar) scrollbar.scrollLeft = scrollLeft;
        
        setTimeout(() => { isUpdating = false; }, 10);
    };
    
    const syncVerticalScroll = () => {
        if (isUpdating || !timeColumn) return;
        isUpdating = true;
        
        const scrollTop = scrollContainer.scrollTop;
        timeColumn.style.transform = `translateY(${-scrollTop}px)`;
        
        setTimeout(() => { isUpdating = false; }, 10);
    };
    
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
    }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
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
    
    showTaskModal(null);
    
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
                            <button type="button" onclick="deleteTaskAndHideModal('${taskId}')"
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
        
        if (isEditing) {
            updateTask(taskId, formData);
            showMessage('Task Updated', 'Task details updated successfully.', 'alert');
        } else {
            createTask(formData);
            showMessage('Task Created', 'New task created successfully.', 'alert');
        }
        
        hideTaskModal();
        
        if (app.currentPage === 'calendar') {
            renderCalendar();
        }
        updateTeamStats();
    });
}

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
        chatHistory: app.chatHistory // Save all chat histories
    };
    
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
            
            // Load chat history
            if (parsed.chatHistory) {
                app.chatHistory = parsed.chatHistory;
                // If old data format was present (onboarding0 chat), remove it and re-initialize onboarding1.
                // This ensures we start with the new onboarding flow if an old history exists.
                if (app.chatHistory.onboarding0) {
                    delete app.chatHistory.onboarding0;
                    app.chatHistory.onboarding1 = [{ role: 'ai', content: 'Great! Now tell me, what is your project idea for this hackathon? I will use this to generate an initial task plan.' }];
                }
            } else {
                // If no chat history or old format, initialize onboarding1 chat
                app.chatHistory = {
                    onboarding1: [{ role: 'ai', content: 'Great! Now tell me, what is your project idea for this hackathon? I will use this to generate an initial task plan.' }],
                    general: []
                };
            }
            
            // Update UI elements on settings page with loaded data
            if (elements.hackathonName) elements.hackathonName.value = app.hackathonSettings.name || '';
            if (elements.startDate && app.hackathonSettings.startDate) {
                elements.startDate.value = formatDateTimeLocal(app.hackathonSettings.startDate);
            }
            if (elements.duration) elements.duration.value = app.hackathonSettings.duration || '48';
            if (elements.projectIdeaInput) elements.projectIdeaInput.value = app.projectIdea || '';
            
        } catch (error) {
            console.error('Error loading data from local storage:', error);
            // Consider showing a user-friendly error or resetting data.
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
        localStorage.clear(); // Clears all items from localStorage

        // Reset application state
        app.currentPage = 'onboarding'; // Reset to onboarding start
        app.onboardingStep = 0;
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
        app.chatHistory = { // Reset chat history to initial state
            onboarding1: [{ role: 'ai', content: 'Great! Now tell me, what is your project idea for this hackathon? I will use this to generate an initial task plan.' }],
            general: []
        };
        
        // Reset UI elements to default states
        initializeUI(); 

        // Manually clear specific UI elements that might retain old values
        if (elements.hackathonName) elements.hackathonName.value = '';
        if (elements.startDate) elements.startDate.value = '';
        if (elements.duration) elements.duration.value = '48';
        if (elements.projectIdeaInput) elements.projectIdeaInput.value = '';
        if (elements.apiKeyInput) elements.apiKeyInput.value = '';
        if (elements.apiEndpointInput) elements.apiEndpointInput.value = '';
        if (elements.aiProviderSelect) elements.aiProviderSelect.value = 'google'; 
        toggleApiKeyInput('google'); 
        
        if (elements.dashboardContent) elements.dashboardContent.innerHTML = ''; // Clear dashboard content
        // Removed elements.onboardingChatHistory0 as it's no longer used for chat
        if (elements.onboardingChatHistory1) elements.onboardingChatHistory1.innerHTML = '';
        if (elements.onboardingTeamList) elements.onboardingTeamList.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">No members added yet.</p>';

        // Hide main sidebar, show onboarding container
        showPage('onboarding'); // This will handle showing onboarding and hiding main sidebar
        
        // Re-render onboarding to initial step
        renderOnboardingCurrentStep();

        showMessage('All Data Cleared', 'All application data has been cleared successfully. The application has been reset. You will now be taken through the onboarding process again.', 'alert', () => {
            // No need to call showPage here, renderOnboardingCurrentStep already handles visibility
        });
    });
}
