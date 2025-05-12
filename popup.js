document.addEventListener('DOMContentLoaded', function() {
  const snippetText = document.getElementById('snippetText');
  const tagSelectForNewSnippet = document.getElementById('tagSelect');
  const inputCard = document.querySelector('.card');
  const inputControlsRow = document.querySelector('.input-controls-row');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const themeSelect = document.getElementById('themeSelect');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');

  // Tag management functionality
  const addTagBtn = document.getElementById('addTagBtn');
  const tagsList = document.getElementById('tagsList');
  
  console.log("DOM elements initialized:");
  console.log("- addTagBtn:", addTagBtn);
  console.log("- tagsList:", tagsList);
  console.log("- settingsModal:", settingsModal);
  
  // Only initialize tag management if elements are found
  if (tagsList) {
    console.log("Tag management elements found, initializing...");
    
    // Initialize tags when popup opens
    loadTags();
    
    // Add event listener for adding new tag
    if (addTagBtn) {
      addTagBtn.addEventListener('click', addNewTag);
    }
  } else {
    console.error("Tag management elements not found! Make sure the HTML contains the required elements.");
  }

  // Initialize counter and snippets from storage
  chrome.storage.local.get(['counter', 'snippets', 'snippetTextHeight', 'lastSelectedTagForNewSnippet', 'extensionTheme'], function(result) {
    document.getElementById('counter').textContent = result.counter || 0;
    if (result.snippets) {
      displaySnippets(result.snippets);
    }

    // Restore textarea height
    if (result.snippetTextHeight && snippetText) {
      snippetText.style.height = result.snippetTextHeight;
    }
    // Always restore height if possible
    if (snippetText && !snippetText.style.height && result.snippetTextHeight) {
      snippetText.style.height = result.snippetTextHeight;
    }

    // Restore last selected tag for new snippet and apply element colors
    if (result.lastSelectedTagForNewSnippet && tagSelectForNewSnippet) {
      tagSelectForNewSnippet.value = result.lastSelectedTagForNewSnippet;
    }
    // Always apply theming on load
    if (tagSelectForNewSnippet && snippetText && inputCard && inputControlsRow) {
      const selectedTag = tagSelectForNewSnippet.value;
      applyTagStyling(selectedTag);
    }

    // Restore theme on load
    const theme = result.extensionTheme || 'light';
    themeSelect.value = theme;
    applyTheme(theme);
  });

  // Save textarea height on mouseup (after potential resize)
  if (snippetText) {
    snippetText.addEventListener('mouseup', function() {
      chrome.storage.local.set({ snippetTextHeight: this.style.height });
    });
    snippetText.addEventListener('input', function() {
      chrome.storage.local.set({ snippetTextHeight: this.style.height });
    });
    window.addEventListener('beforeunload', function() {
      chrome.storage.local.set({ snippetTextHeight: snippetText.style.height });
    });
    snippetText.addEventListener('blur', function() {
      chrome.storage.local.set({ snippetTextHeight: snippetText.style.height });
    });
  }

  // Counter controls
  document.getElementById('incrementBtn').addEventListener('click', function() {
    updateCounter(1);
  });

  document.getElementById('decrementBtn').addEventListener('click', function() {
    updateCounter(-1);
  });

  // Reset button
  document.getElementById('resetBtn').addEventListener('click', function() {
    chrome.storage.local.set({ counter: 0 }, function() {
      document.getElementById('counter').textContent = '0';
    });
  });

  // Apply tag styling function to keep color application consistent
  function applyTagStyling(selectedTag) {
    const elementsToTheme = [inputCard, snippetText, tagSelectForNewSnippet, inputControlsRow];
    
    // Remove all existing tag classes
    elementsToTheme.forEach(el => {
      if (el) {
        // Remove existing tag classes
        el.classList.forEach(className => {
          if (className.startsWith('bg-')) {
            el.classList.remove(className);
          }
        });
      }
    });
    
    // Apply new tag styling if a tag is selected
        if (selectedTag) {
      chrome.storage.local.get(['customTags'], function(result) {
        const tags = result.customTags || defaultTags;
        const tag = tags.find(t => t.id === selectedTag);
        
        if (tag) {
          const colorId = tag.colorId;
          
          elementsToTheme.forEach(el => {
            if (el) {
              el.classList.add(`bg-${colorId}`);
        }
          });
      }
    });
    }
  }

  // Code for coloring the input card, snippetText, and tagSelectForNewSnippet based on tag selection
  if (tagSelectForNewSnippet) {
    tagSelectForNewSnippet.addEventListener('change', function() {
      const selectedTag = this.value;
      applyTagStyling(selectedTag);
      chrome.storage.local.set({ lastSelectedTagForNewSnippet: selectedTag });
    });
  }

  // Save snippet
  document.getElementById('saveSnippet').addEventListener('click', function() {
    const text = snippetText.value.trim();
    const tag = tagSelectForNewSnippet.value; // This is the currently selected tag
    
    if (text) {
      chrome.storage.local.get(['snippets'], function(result) {
        const snippets = result.snippets || [];
        const newSnippet = { id: Date.now(), text: text, tag: tag, timestamp: new Date().toLocaleString() };
        snippets.unshift(newSnippet);
        chrome.storage.local.set({ snippets: snippets }, function() {
          snippetText.value = '';
          applyFilters();
        });
      });
    }
  });

  // Add tag filter event listener (for #tagFilter - the one in the filter row)
  document.getElementById('tagFilter').addEventListener('change', function() {
    applyFilters();
  });

  // Date filter input and search input
  const dateFilterInput = document.getElementById('dateFilter');
  const searchInput = document.getElementById('searchSnippets'); 

  // Add date filter event listener
  dateFilterInput.addEventListener('input', function() {
    applyFilters();
    // Format the date to MM/DD for display (optional, can be kept or removed)
    if (dateFilterInput.value) {
      const date = new Date(dateFilterInput.value);
      if (!isNaN(date)) {
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        dateFilterInput.setAttribute('data-formatted', `${mm}/${dd}`);
        dateFilterInput.blur();
        setTimeout(() => dateFilterInput.blur(), 10);
      }
    } else {
      dateFilterInput.removeAttribute('data-formatted');
    }
  });

  // Add search input event listener
  searchInput.addEventListener('input', function() {
    applyFilters();
  });

  // Set max date to today for dateFilterInput
  if (dateFilterInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateFilterInput.max = `${yyyy}-${mm}-${dd}`;
  }

  let calendarOpen = false;
  dateFilterInput.addEventListener('mousedown', function(e) {
    e.preventDefault();
    if (calendarOpen) {
      dateFilterInput.blur();
      calendarOpen = false;
    } else {
      dateFilterInput.showPicker && dateFilterInput.showPicker();
      calendarOpen = true;
    }
  });
  dateFilterInput.addEventListener('blur', function() {
    calendarOpen = false;
  });
  dateFilterInput.addEventListener('keydown', function(e) {
    const allowedKeys = ["Tab", "ArrowLeft", "ArrowRight", "Backspace", "Delete"];
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  });

  // Paste & Save functionality
  document.getElementById('pasteSaveSnippet').addEventListener('click', async function() {
    const tag = tagSelectForNewSnippet.value;
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        chrome.storage.local.get(['snippets'], function(result) {
          const snippets = result.snippets || [];
          const newSnippet = { id: Date.now(), text: text.trim(), tag: tag, timestamp: new Date().toLocaleString() };
          snippets.unshift(newSnippet);
          chrome.storage.local.set({ snippets: snippets }, function() {
            snippetText.value = '';
            applyFilters();
          });
        });
      }
    } catch (err) {
      alert('Could not read clipboard. Please allow clipboard permissions for this extension in your browser settings.');
    }
  });

  // Open settings modal
  settingsBtn.addEventListener('click', function() {
    settingsModal.style.display = 'flex';
  });
  // Close settings modal
  closeSettings.addEventListener('click', function() {
    settingsModal.style.display = 'none';
  });
  // Close modal on overlay click
  settingsModal.addEventListener('click', function(e) {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  // Theme switching
  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add('theme-' + theme);
  }
  themeSelect.addEventListener('change', function() {
    const theme = themeSelect.value;
    applyTheme(theme);
    chrome.storage.local.set({ extensionTheme: theme });
  });

  // --- Settings Toggles ---
  const toggles = [
    { id: 'toggleTimestamp', selector: '.snippet-timestamp', all: true },
    { id: 'toggleDateFilter', selector: '.date-filter-group' },
    { id: 'toggleTagFilter', selector: '.tag-filter-container' },
    { id: 'toggleSearchFilter', selector: '.search-filter-group' },
    { id: 'toggleSnippetTags', selector: '.snippet-top-tag', all: true }
  ];

  function applyToggles(settings) {
    toggles.forEach(t => {
      const show = settings[t.id] !== false;
      if (t.all) {
        document.querySelectorAll(t.selector).forEach(el => el.classList.toggle('hidden', !show));
      } else {
        const el = document.querySelector(t.selector);
        if (el) el.classList.toggle('hidden', !show);
      }
    });
    
    // Add logic for input-controls-row layout
    const inputControlsRow = document.querySelector('.input-controls-row');
    if (inputControlsRow) {
      const saveButton = document.querySelector('#saveSnippet');
      const pasteButton = document.querySelector('#pasteSaveSnippet');
      
      // Remove all layout classes first
      inputControlsRow.classList.remove('hide-save', 'hide-paste', 'hide-both');
      
      // Logic for 'hide-both' might still be relevant if other mechanisms could hide these buttons,
      // but with toggle removal, this specific condition (both hidden by toggles) won't be met.
      // For now, we can simplify or assume buttons are always visible from toggle perspective.
      // However, if something else hides them and we want the select to expand, this logic could be:
      if (saveButton && saveButton.classList.contains('hidden') &&
          pasteButton && pasteButton.classList.contains('hidden')) {
        inputControlsRow.classList.add('hide-both');
      }
    }
  }

  function saveTogglesToStorage() {
    const settings = {};
    toggles.forEach(t => {
      settings[t.id] = document.getElementById(t.id).checked;
    });
    chrome.storage.local.set(settings);
    applyToggles(settings);
  }

  toggles.forEach(t => {
    const cb = document.getElementById(t.id);
    if (cb) cb.addEventListener('change', saveTogglesToStorage);
  });

  // Restore toggles from storage
  chrome.storage.local.get(toggles.map(t => t.id), function(settings) {
    toggles.forEach(t => {
      const cb = document.getElementById(t.id);
      if (cb) cb.checked = settings[t.id] !== false;
    });
    applyToggles(settings);
  });

  // Counter management functionality
  const addCounterBtn = document.getElementById('addCounterBtn');
  const countersList = document.getElementById('countersList');
  const additionalCountersGrid = document.getElementById('additionalCountersGrid');

  // Initialize main counter in settings
  function initializeMainCounter() {
    chrome.storage.local.get(['mainCounterName'], function(result) {
      const mainCounterName = result.mainCounterName || 'Main Counter';
      const mainCounter = document.createElement('div');
      mainCounter.className = 'counter-item main-counter';
      mainCounter.innerHTML = `
        <div class="counter-info">
          <span class="counter-name">${mainCounterName}</span>
          <div class="counter-actions">
            <button class="edit-counter" data-id="main" title="Edit name">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="toggle-counter" data-id="main" title="Hide counter">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
      `;
      
      // If countersList exists, append the main counter
      if (countersList) {
        // Clear any existing main counter
        const existingMainCounter = countersList.querySelector('.main-counter');
        if (existingMainCounter) {
          existingMainCounter.remove();
        }
        
        // Add the new main counter at the beginning
        if (countersList.firstChild) {
          countersList.insertBefore(mainCounter, countersList.firstChild);
        } else {
          countersList.appendChild(mainCounter);
        }
        
        // Update toggle button icon based on visibility
        chrome.storage.local.get(['hiddenCounters'], function(result) {
          const hiddenCounters = result.hiddenCounters || [];
          const isMainHidden = hiddenCounters.includes('main');
          const mainToggleBtn = mainCounter.querySelector('.toggle-counter');
          
          if (mainToggleBtn) {
            updateToggleButtonIcon(mainToggleBtn, isMainHidden);
          }
        });
      }
      
      return mainCounter;
    });
    
    // Return a placeholder while the async operation completes
    const placeholder = document.createElement('div');
    placeholder.className = 'counter-item main-counter';
    return placeholder;
  }

  // Load counters
  function loadCounters() {
    chrome.storage.local.get(['additionalCounters', 'mainCounterName', 'hiddenCounters'], function(result) {
      const counters = result.additionalCounters || [];
      const mainCounterName = result.mainCounterName || 'Main Counter';
      const hiddenCounters = result.hiddenCounters || [];
      
      // Update main counter name in settings
      const mainCounterNameEl = document.querySelector('.main-counter .counter-name');
      if (mainCounterNameEl) {
        mainCounterNameEl.textContent = mainCounterName;
      }
      
      // Update main counter name in header
      const counterTitle = document.querySelector('.logo-title b');
      if (counterTitle) {
        counterTitle.textContent = mainCounterName + ':';
      }
      
      // Update main counter visibility
      const mainCounterToggle = document.querySelector('.main-counter .toggle-counter');
      if (mainCounterToggle) {
        mainCounterToggle.classList.toggle('hidden', hiddenCounters.includes('main'));
      }
      
      displayCountersList(counters);
      displayAdditionalCountersGrid(counters, hiddenCounters);
    });
  }

  // Display counters in settings modal
  function displayCountersList(counters) {
    if (!countersList) return;
    
    // Clear the list except for the main counter which will be updated by initializeMainCounter
    const existingItems = countersList.querySelectorAll('.counter-item:not(.main-counter)');
    existingItems.forEach(item => item.remove());
    
    // Initialize or update the main counter
    initializeMainCounter();
    
    // Add additional counters
    counters.forEach(counter => {
      const counterItem = document.createElement('div');
      counterItem.className = 'counter-item';
      counterItem.innerHTML = `
        <div class="counter-info">
          <span class="counter-name">${counter.name}</span>
          <div class="counter-actions">
            <button class="edit-counter" data-id="${counter.id}" title="Edit name">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="delete-counter" data-id="${counter.id}" title="Delete counter">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
            <button class="toggle-counter" data-id="${counter.id}" title="Hide counter">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
      `;
      countersList.appendChild(counterItem);
      
      // Update toggle button icon based on visibility
      chrome.storage.local.get(['hiddenCounters'], function(result) {
        const hiddenCounters = result.hiddenCounters || [];
        const isHidden = hiddenCounters.includes(counter.id);
        const toggleBtn = counterItem.querySelector('.toggle-counter');
        
        if (toggleBtn) {
          updateToggleButtonIcon(toggleBtn, isHidden);
        }
      });
    });
  }

  // Helper function to update toggle button icon
  function updateToggleButtonIcon(button, isHidden) {
    if (isHidden) {
      button.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
      button.title = "Show counter";
      button.classList.add('hidden');
    } else {
      button.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
      button.title = "Hide counter";
      button.classList.remove('hidden');
    }
  }

  // Display additional counters in grid
  function displayAdditionalCountersGrid(counters, hiddenCounters) {
    if (!additionalCountersGrid) return;
    
    additionalCountersGrid.innerHTML = '';
    
    // Show/hide main counter based on hiddenCounters
    const mainCounter = document.querySelector('.header-title-counter');
    if (mainCounter) {
      mainCounter.style.display = hiddenCounters.includes('main') ? 'none' : 'flex';
    }
    
    // Hide the grid completely if there are no visible counters
    let visibleCounters = 0;
    
    counters.forEach(counter => {
      if (!hiddenCounters.includes(counter.id)) {
        visibleCounters++;
        const miniCounter = document.createElement('div');
        miniCounter.className = 'mini-counter';
        miniCounter.innerHTML = `
          <div class="counter-header">
            <span class="counter-title">${counter.name}</span>
          </div>
          <div class="counter-controls">
            <button class="decrement-mini" data-id="${counter.id}" aria-label="Decrement">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <span class="counter-value">${counter.value || 0}</span>
            <button class="increment-mini" data-id="${counter.id}" aria-label="Increment">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        `;
        additionalCountersGrid.appendChild(miniCounter);
      }
    });

    // Show/hide the grid container based on whether there are visible counters
    additionalCountersGrid.style.display = visibleCounters > 0 ? 'grid' : 'none';

    // Add event listeners for mini counter buttons
    document.querySelectorAll('.decrement-mini').forEach(btn => {
      btn.addEventListener('click', () => updateMiniCounter(btn.dataset.id, -1));
    });
    document.querySelectorAll('.increment-mini').forEach(btn => {
      btn.addEventListener('click', () => updateMiniCounter(btn.dataset.id, 1));
    });
  }

  // Update mini counter value
  function updateMiniCounter(id, change) {
    chrome.storage.local.get(['additionalCounters'], function(result) {
      const counters = result.additionalCounters || [];
      const counterIndex = counters.findIndex(c => c.id === id);
      if (counterIndex !== -1) {
        counters[counterIndex].value = Math.max(0, (counters[counterIndex].value || 0) + change);
        chrome.storage.local.set({ additionalCounters: counters }, function() {
          loadCounters();
        });
      }
    });
  }

  // Add new counter
  if (addCounterBtn) {
    addCounterBtn.addEventListener('click', function() {
      chrome.storage.local.get(['additionalCounters'], function(result) {
        const counters = result.additionalCounters || [];
        if (counters.length >= 6) {
          alert('Maximum number of additional counters (6) reached!');
          return;
        }
        
        const counterName = prompt('Enter a name for the new counter:');
        if (counterName && counterName.trim()) {
          const newCounter = {
            id: Date.now().toString(),
            name: counterName.trim(),
            value: 0
          };
          counters.push(newCounter);
          chrome.storage.local.set({ additionalCounters: counters }, function() {
            loadCounters();
          });
        }
      });
    });
  }

  // Handle counter actions (edit, delete, toggle)
  if (countersList) {
    countersList.addEventListener('click', function(e) {
      const button = e.target.closest('button');
      if (!button) return;
      
      const counterId = button.dataset.id;
      if (!counterId) return;
      
      if (button.classList.contains('edit-counter')) {
        const counterName = prompt('Enter new name for the counter:');
        if (counterName && counterName.trim()) {
          if (counterId === 'main') {
            chrome.storage.local.set({ mainCounterName: counterName.trim() }, function() {
              loadCounters();
            });
          } else {
            chrome.storage.local.get(['additionalCounters'], function(result) {
              const counters = result.additionalCounters || [];
              const counterIndex = counters.findIndex(c => c.id === counterId);
              if (counterIndex !== -1) {
                counters[counterIndex].name = counterName.trim();
                chrome.storage.local.set({ additionalCounters: counters }, function() {
                  loadCounters();
                });
              }
            });
          }
        }
      } else if (button.classList.contains('delete-counter')) {
        chrome.storage.local.get(['additionalCounters'], function(result) {
          const counters = result.additionalCounters || [];
          const updatedCounters = counters.filter(c => c.id !== counterId);
          chrome.storage.local.set({ additionalCounters: updatedCounters }, function() {
            loadCounters();
          });
        });
      } else if (button.classList.contains('toggle-counter')) {
        chrome.storage.local.get(['hiddenCounters'], function(result) {
          const hiddenCounters = result.hiddenCounters || [];
          const isHidden = hiddenCounters.includes(counterId);
          
          if (isHidden) {
            const updatedHidden = hiddenCounters.filter(id => id !== counterId);
            chrome.storage.local.set({ hiddenCounters: updatedHidden }, function() {
              updateToggleButtonIcon(button, false);
              loadCounters();
            });
          } else {
            hiddenCounters.push(counterId);
            chrome.storage.local.set({ hiddenCounters: hiddenCounters }, function() {
              updateToggleButtonIcon(button, true);
              loadCounters();
            });
          }
        });
      }
    });
  }

  // Initialize counters when popup opens
  loadCounters();

  // Color options for tags
  const colorOptions = [
    { id: 'created', name: 'Green', color: '#10b981', bgColor: '#F0FFF4', darkColor: '#0E9F70' },
    { id: 'closed', name: 'Red', color: '#D9534F', bgColor: '#FFF0F0', darkColor: '#C9302C' },
    { id: 'reopened', name: 'Blue', color: '#007BFF', bgColor: '#F0F8FF', darkColor: '#0056B3' },
    { id: 'note', name: 'Yellow', color: '#FFC107', bgColor: '#FFF9E6', darkColor: '#D9A400' },
    { id: 'purple', name: 'Purple', color: '#9C27B0', bgColor: '#F5E9FF', darkColor: '#7B1FA2' },
    { id: 'teal', name: 'Teal', color: '#009688', bgColor: '#E0F2F1', darkColor: '#00796B' },
    { id: 'orange', name: 'Orange', color: '#FF9800', bgColor: '#FFF3E0', darkColor: '#F57C00' },
    { id: 'pink', name: 'Pink', color: '#E91E63', bgColor: '#FCE4EC', darkColor: '#C2185B' },
    { id: 'indigo', name: 'Indigo', color: '#3F51B5', bgColor: '#E8EAF6', darkColor: '#303F9F' },
    { id: 'lime', name: 'Lime', color: '#8BC34A', bgColor: '#F1F8E9', darkColor: '#689F38' },
    { id: 'brown', name: 'Brown', color: '#795548', bgColor: '#EFEBE9', darkColor: '#5D4037' },
    { id: 'gray', name: 'Gray', color: '#607D8B', bgColor: '#ECEFF1', darkColor: '#455A64' }
  ];

  // Default tags
  const defaultTags = [
    { id: 'created', name: 'Created', colorId: 'created' },
    { id: 'closed', name: 'Closed', colorId: 'closed' },
    { id: 'reopened', name: 'Reopened', colorId: 'reopened' },
    { id: 'note', name: 'Note', colorId: 'note' }
  ];

  // Load tags
  function loadTags() {
    console.log("Loading tags...");
    chrome.storage.local.get(['customTags'], function(result) {
      console.log("Retrieved tags from storage:", result.customTags);
      let tags = result.customTags;
      
      // If no tags found in storage, initialize with default tags
      if (!tags || tags.length === 0) {
        console.log("No tags found, initializing with defaults");
        tags = defaultTags;
        // Save default tags to storage
        chrome.storage.local.set({ customTags: defaultTags }, function() {
          console.log("Default tags saved to storage");
        });
      }
      
      console.log("Tags to display:", tags);
      displayTagsList(tags);
      updateTagSelects(tags);
    });
  }

  // Display tags in settings modal
  function displayTagsList(tags) {
    console.log("Displaying tags list:", tags);
    
    if (!tagsList) {
      console.error("Tags list element not found in DOM!");
      return;
    }
    
    console.log("Clearing tags list and adding", tags.length, "tags");
    tagsList.innerHTML = '';
    
    tags.forEach(tag => {
      const colorInfo = colorOptions.find(c => c.id === tag.colorId) || colorOptions[0];
      console.log(`Creating tag item for "${tag.name}" with color ${colorInfo.color}`);
      
      const tagItem = document.createElement('div');
      tagItem.className = 'tag-item';
      tagItem.dataset.id = tag.id;
      tagItem.style.borderLeft = `4px solid ${colorInfo.color}`;
      
      // Check if this is the only tag left
      const isLastTag = tags.length === 1;
      
      tagItem.innerHTML = `
        <div class="tag-info">
          <span class="tag-name">${tag.name}</span>
          <div class="tag-actions">
            <button class="edit-tag" data-id="${tag.id}" title="Edit tag">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            ${!isLastTag ? 
              `<button class="delete-tag" data-id="${tag.id}" title="Delete tag">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>` : ''}
          </div>
        </div>
        <div class="tag-color-picker">
          ${colorOptions.map(color => `
            <div class="color-option ${color.id === tag.colorId ? 'selected' : ''}" 
                 data-color-id="${color.id}" 
                 style="background-color: ${color.color};"
                 title="${color.name}">
            </div>
          `).join('')}
        </div>
      `;
      
      tagsList.appendChild(tagItem);
      
      // Add event listeners for color options
      const colorOptionElements = tagItem.querySelectorAll('.color-option');
      colorOptionElements.forEach(option => {
        option.addEventListener('click', () => {
          const colorId = option.dataset.colorId;
          updateTagColor(tag.id, colorId);
        });
      });
    });
    
    console.log("Finished adding tags to list, adding event listeners");
    
    // Add event listeners for tag actions
    const editButtons = tagsList.querySelectorAll('.edit-tag');
    editButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tagId = btn.dataset.id;
        editTag(tagId);
      });
    });
    
    const deleteButtons = tagsList.querySelectorAll('.delete-tag');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tagId = btn.dataset.id;
        deleteTag(tagId);
      });
    });
    
    console.log("Tag list display complete");
  }

  // Update tag selects in the UI
  function updateTagSelects(tags) {
    const tagSelects = [
      document.getElementById('tagSelect'),
      document.getElementById('tagFilter')
    ];
    
    tagSelects.forEach(select => {
      if (!select) return;
      
      // Save current value
      const currentValue = select.value;
      
      // Clear options except "All Tags" for the filter
      if (select.id === 'tagFilter') {
        select.innerHTML = '<option value="all">All Tags</option>';
      } else {
        select.innerHTML = '';
      }
      
      // Add options for each tag
      tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.id;
        option.textContent = tag.name;
        option.className = `tag-option-${tag.colorId}`;
        select.appendChild(option);
      });
      
      // Restore selected value if it still exists
      if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
        select.value = currentValue;
      }
    });
  }

  // Edit tag name
  function editTag(tagId) {
    chrome.storage.local.get(['customTags', 'snippets'], function(result) {
      const tags = result.customTags || defaultTags;
      const tag = tags.find(t => t.id === tagId);
      
      if (tag) {
        const newName = prompt('Enter new name for the tag:', tag.name);
        if (newName && newName.trim()) {
          tag.name = newName.trim();
          
          // Update the tag name in all snippets (no need to change the tag ID)
          const snippets = result.snippets || [];
          
          chrome.storage.local.set({ 
            customTags: tags
          }, function() {
            loadTags();
            if (snippets.length > 0) {
              displaySnippets(snippets);
            }
          });
        }
      }
    });
  }

  // Delete tag
  function deleteTag(tagId) {
    // Check if this is the last tag
    chrome.storage.local.get(['customTags'], function(result) {
      const tags = result.customTags || defaultTags;
      
      if (tags.length <= 1) {
        alert('Cannot delete the last tag. At least one tag must remain.');
        return;
      }
      
      // Check if any snippets are using this tag
      chrome.storage.local.get(['snippets'], function(result) {
        const snippets = result.snippets || [];
        const snippetsWithTag = snippets.filter(s => s.tag === tagId);
        
        if (snippetsWithTag.length > 0) {
          const confirmMessage = `This tag is used by ${snippetsWithTag.length} snippet(s). Deleting this tag will convert those snippets to use the "Note" tag instead. Are you sure you want to delete this tag?`;
          if (!confirm(confirmMessage)) {
            return;
          }
        } else {
          if (!confirm('Are you sure you want to delete this tag?')) {
            return;
          }
        }
        
        // Proceed with deletion
        chrome.storage.local.get(['customTags'], function(result) {
          const tags = result.customTags || defaultTags;
          const updatedTags = tags.filter(t => t.id !== tagId);
          
          // Update snippets that use this tag to use 'note' instead
          const updatedSnippets = snippets.map(snippet => {
            if (snippet.tag === tagId) {
              return { ...snippet, tag: 'note' };
            }
            return snippet;
          });
          
          chrome.storage.local.set({ 
            customTags: updatedTags,
            snippets: updatedSnippets
          }, function() {
            loadTags();
            if (result.snippets) {
              displaySnippets(updatedSnippets);
            }
          });
        });
      });
    });
  }

  // Update tag color
  function updateTagColor(tagId, colorId) {
    chrome.storage.local.get(['customTags'], function(result) {
      const tags = result.customTags || defaultTags;
      const tagIndex = tags.findIndex(t => t.id === tagId);
      
      if (tagIndex !== -1) {
        tags[tagIndex].colorId = colorId;
        chrome.storage.local.set({ customTags: tags }, function() {
          loadTags();
        });
      }
    });
  }

  // Add new tag
  function addNewTag() {
    chrome.storage.local.get(['customTags'], function(result) {
      const tags = result.customTags || defaultTags;
      // Check if maximum tags limit reached
      if (tags.length >= 8) {
        alert('Maximum number of tags (8) reached!');
        return;
      }
      const tagName = prompt('Enter a name for the new tag:');
      if (tagName && tagName.trim()) {
        // Find first unused colorId from colorOptions
        const usedColorIds = tags.map(t => t.colorId);
        const availableColor = colorOptions.find(c => !usedColorIds.includes(c.id)) || colorOptions.find(c => c.id === 'purple');
        const colorId = availableColor ? availableColor.id : 'purple';
        // Create a slug-like ID from the name
        const tagId = tagName.trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);
        const newTag = {
          id: tagId,
          name: tagName.trim(),
          colorId: colorId
        };
        tags.push(newTag);
        chrome.storage.local.set({ customTags: tags }, function() {
          loadTags();
          // Set the new tag as selected and apply styling
          const tagSelect = document.getElementById('tagSelect');
          if (tagSelect) {
            setTimeout(() => {
              tagSelect.value = newTag.id;
              if (typeof applyTagStyling === 'function') applyTagStyling(newTag.id);
              chrome.storage.local.set({ lastSelectedTagForNewSnippet: newTag.id });
            }, 100);
          }
        });
      }
    });
  }

  // Initialize tags when popup opens
  console.log("DOM loaded, initializing tags...");
  loadTags();

  // Export and Import Data functionality
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportData);
  }
  
  if (importDataBtn) {
    importDataBtn.addEventListener('click', function() {
      importFileInput.click();
    });
  }
  
  if (importFileInput) {
    importFileInput.addEventListener('change', importData);
  }
});

function applyFilters() {
  const selectedTag = document.getElementById('tagFilter').value;
  const selectedDate = document.getElementById('dateFilter').value;
  const searchTerm = document.getElementById('searchSnippets').value.toLowerCase();

  // Style the tag filter dropdown based on selection
  const tagFilterSelect = document.getElementById('tagFilter');
  
  // Remove all existing tag classes
  tagFilterSelect.classList.forEach(className => {
    if (className.startsWith('bg-')) {
      tagFilterSelect.classList.remove(className);
    }
  });

  if (selectedTag !== 'all') {
    chrome.storage.local.get(['customTags'], function(result) {
      const tags = result.customTags || defaultTags;
      const tag = tags.find(t => t.id === selectedTag);
      
      if (tag) {
        tagFilterSelect.classList.add(`bg-${tag.colorId}`);
      }
    });
  }

  chrome.storage.local.get(['snippets'], function(result) {
    const allSnippets = result.snippets || [];
    let filteredSnippets = allSnippets;

    // Filter by tag
    if (selectedTag !== 'all') {
      filteredSnippets = filteredSnippets.filter(snippet => snippet.tag === selectedTag);
    }

    // Filter by date
    if (selectedDate) {
      filteredSnippets = filteredSnippets.filter(snippet => {
        const snippetDate = new Date(snippet.timestamp).toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD
        return snippetDate === selectedDate;
      });
    }

    // Filter by search term (search in snippet.text)
    if (searchTerm) {
      filteredSnippets = filteredSnippets.filter(snippet => 
        snippet.text.toLowerCase().includes(searchTerm)
      );
    }

    displaySnippets(filteredSnippets);
  });
}

function updateCounter(change) {
  chrome.storage.local.get(['counter'], function(result) {
    const newCount = Math.max(0, (result.counter || 0) + change);
    chrome.storage.local.set({ counter: newCount }, function() {
      document.getElementById('counter').textContent = newCount;
    });
  });
}

function displaySnippets(snippets) {
  const snippetsList = document.getElementById('snippetsList');
  snippetsList.innerHTML = '';

  chrome.storage.local.get(['customTags'], function(result) {
    const tags = result.customTags || defaultTags;

  snippets.forEach(snippet => {
      // Find the tag object for this snippet
      const tagObj = tags.find(t => t.id === snippet.tag) || 
                    { id: snippet.tag, name: snippet.tag, colorId: 'note' }; // Default to note if tag not found
      
    const snippetElement = document.createElement('div');
      snippetElement.className = `snippet-item ${tagObj.colorId}`;
    
    // Tag displayed on top
    const topTagElement = document.createElement('div');
    topTagElement.className = 'snippet-top-tag';
      topTagElement.textContent = tagObj.name;
    snippetElement.appendChild(topTagElement);
    
    // Add timestamp
    const timestampEl = document.createElement('small');
    timestampEl.classList.add('snippet-timestamp');
    const date = new Date(snippet.timestamp);
    timestampEl.textContent = date.toLocaleString();
    topTagElement.appendChild(timestampEl);
    
    // Wrapper for content and actions to sit side by side
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'snippet-content-wrapper';

    // Content
    const content = document.createElement('div');
    content.className = 'snippet-content';
    const textWithLinks = snippet.text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank">$1</a>'
    );
    content.innerHTML = `<div>${textWithLinks}</div>`;
    contentWrapper.appendChild(content);

    // Actions (Copy, Delete, Expand) - Now in vertical layout
    const actions = document.createElement('div');
    actions.className = 'snippet-actions';

    // Create and append Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.title = 'Copy';
    copyBtn.setAttribute('aria-label', 'Copy');
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    copyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(snippet.text);
      // Show tick icon for 1 second
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      setTimeout(() => {
        copyBtn.innerHTML = `<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg>`;
      }, 1000);
    });
    actions.appendChild(copyBtn);

    // Create and append Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete');
    deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
    deleteBtn.addEventListener('click', function() {
      chrome.storage.local.get(['snippets'], function(result) {
        const updatedSnippets = result.snippets.filter(s => s.id !== snippet.id);
        chrome.storage.local.set({ snippets: updatedSnippets }, function() {
          // Re-filter based on current tag filter after deletion
          const currentFilter = document.getElementById('tagFilter').value;
          const event = new Event('change');
          document.getElementById('tagFilter').dispatchEvent(event);
        });
      });
    });
    actions.appendChild(deleteBtn);
    
    // Check for overflow and add Expand button if needed
    // Temporarily append to DOM to measure, then remove if not needed or re-append properly
    const tempSnippetElementForMeasurement = snippetElement.cloneNode(true);
    tempSnippetElementForMeasurement.style.visibility = 'hidden';
    tempSnippetElementForMeasurement.style.position = 'absolute';
    document.body.appendChild(tempSnippetElementForMeasurement);
    const tempContent = tempSnippetElementForMeasurement.querySelector('.snippet-content');
    
    if (tempContent && tempContent.scrollHeight > tempContent.clientHeight) {
      const expandBtn = document.createElement('button');
      expandBtn.className = 'expand-btn';
      expandBtn.title = 'Expand';
      expandBtn.setAttribute('aria-label', 'Expand');
      expandBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`; // Chevron down
      
      expandBtn.addEventListener('click', function() {
        content.classList.toggle('expanded');
        const isExpanded = content.classList.contains('expanded');
        expandBtn.title = isExpanded ? 'Collapse' : 'Expand';
        expandBtn.setAttribute('aria-label', isExpanded ? 'Collapse' : 'Expand');
        expandBtn.classList.toggle('expanded', isExpanded);
      });
      actions.appendChild(expandBtn);
    }
    document.body.removeChild(tempSnippetElementForMeasurement);

    // Append actions to content wrapper instead of inside content
    contentWrapper.appendChild(actions);
    snippetElement.appendChild(contentWrapper);
    snippetsList.appendChild(snippetElement);
  });
  });
}

// Add these functions at the end of the file, before the closing });
function exportData() {
  // Get all data from storage
  chrome.storage.local.get(null, function(data) {
    // Convert the data to a JSON string
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create a blob with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename with current date and time
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    a.download = `tc-counter-backup-${dateStr}-${timeStr}.json`;
    
    // Append the anchor to the body, click it, and remove it
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Release the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // Show success message
    showNotification('Data exported successfully!', 'success');
  });
}

function importData() {
  const fileInput = document.getElementById('importFileInput');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('No file selected.', 'error');
    return;
  }
  
  if (file.type !== 'application/json') {
    showNotification('Please select a valid JSON file.', 'error');
    fileInput.value = '';
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Confirm import
      if (confirm('This will replace all your current data. Are you sure you want to continue?')) {
        // Clear existing data and import new data
        chrome.storage.local.clear(function() {
          chrome.storage.local.set(data, function() {
            // Reload the page to reflect the imported data
            showNotification('Data imported successfully! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 1000);
          });
        });
      }
    } catch (error) {
      showNotification('Invalid JSON file. Please try again.', 'error');
      console.error('Import error:', error);
    }
    
    // Reset the file input
    fileInput.value = '';
  };
  
  reader.readAsText(file);
}

// Notification function for feedback
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.className = 'notification-close';
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(notification);
  });
  
  notification.appendChild(closeBtn);
  
  // Add to body
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
}