/**
 * Welltoodit - Professional Notepad Application
 * Main application controller and initialization
 */

class WelltooditApp {
  constructor() {
    this.notepad = null;
    this.saveIndicator = null;
    this.wordCount = null;
    this.charCount = null;
    this.saveTimeout = null;
    this.lastSaveTime = null;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadSavedNote();
    this.initializeTheme();
    this.setupKeyboardShortcuts();
    this.updateStats();
    
    console.log('✅ Welltoodit initialized successfully');
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.notepad = document.getElementById('notepad');
    this.saveIndicator = document.querySelector('.save-indicator');
    this.wordCount = document.getElementById('word-count');
    this.charCount = document.getElementById('char-count');
    this.clearBtn = document.getElementById('clear-btn');
    this.downloadBtn = document.getElementById('download-btn');
    this.themeToggle = document.getElementById('theme-toggle');
    this.lastSaveElement = document.getElementById('last-save');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Text input events
    this.notepad.addEventListener('input', this.handleInput.bind(this));
    this.notepad.addEventListener('paste', this.handlePaste.bind(this));
    
    // Button events
    this.clearBtn.addEventListener('click', this.handleClearNote.bind(this));
    this.downloadBtn.addEventListener('click', this.handleDownload.bind(this));
    this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    
    // Auto-save on page unload
    window.addEventListener('beforeunload', this.saveNote.bind(this));
    
    // Handle visibility change for better UX
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Handle text input with debounced saving
   */
  handleInput() {
    this.updateStats();
    this.debouncedSave();
  }

  /**
   * Handle paste events
   */
  handlePaste() {
    // Small delay to let paste complete
    setTimeout(() => {
      this.updateStats();
      this.debouncedSave();
    }, 10);
  }

  /**
   * Debounced save function to avoid excessive localStorage writes
   */
  debouncedSave() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveNote();
    }, 500); // Save after 500ms of no typing
  }

  /**
   * Save note to localStorage with visual feedback
   */
  saveNote() {
    const content = this.notepad.value;
    
    try {
      localStorage.setItem('welltoodit-note', content);
      this.lastSaveTime = new Date();
      this.showSaveIndicator();
      this.updateLastSaveTime();
    } catch (error) {
      console.error('❌ Failed to save note:', error);
      this.showError('Failed to save note. Storage might be full.');
    }
  }

  /**
   * Load saved note from localStorage
   */
  loadSavedNote() {
    try {
      const savedNote = localStorage.getItem('welltoodit-note');
      if (savedNote !== null) {
        this.notepad.value = savedNote;
        this.updateStats();
        
        // Check if there's a last save time
        const lastSave = localStorage.getItem('welltoodit-last-save');
        if (lastSave) {
          this.lastSaveTime = new Date(lastSave);
          this.updateLastSaveTime();
        }
      }
    } catch (error) {
      console.error('❌ Failed to load saved note:', error);
    }
  }

  /**
   * Handle clear note with confirmation
   */
  handleClearNote() {
    const hasContent = this.notepad.value.trim().length > 0;
    
    if (!hasContent) {
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to clear all your notes? This action cannot be undone.'
    );
    
    if (confirmed) {
      this.notepad.value = '';
      this.clearStorage();
      this.updateStats();
      this.notepad.focus();
      
      console.log('🗑️ Note cleared by user');
    }
  }

  /**
   * Clear all stored data
   */
  clearStorage() {
    try {
      localStorage.removeItem('welltoodit-note');
      localStorage.removeItem('welltoodit-last-save');
      this.lastSaveTime = null;
      this.updateLastSaveTime();
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
    }
  }

  /**
   * Handle note download as text file
   */
  handleDownload() {
    const content = this.notepad.value;
    
    if (!content.trim()) {
      alert('Nothing to download! Your notepad is empty.');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_');
    const filename = `welltoodit_note_${timestamp}.txt`;
    
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      console.log(`📥 Note downloaded as: ${filename}`);
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert('Download failed. Please try again.');
    }
  }

  /**
   * Update word and character count
   */
  updateStats() {
    const content = this.notepad.value;
    
    // Character count (including spaces)
    const charCount = content.length;
    
    // Word count (more accurate counting)
    const wordCount = content.trim() === '' ? 0 : 
      content.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Update display
    this.wordCount.textContent = wordCount.toLocaleString();
    this.charCount.textContent = charCount.toLocaleString();
  }

  /**
   * Show save indicator with animation
   */
  showSaveIndicator() {
    this.saveIndicator.classList.add('visible');
    
    setTimeout(() => {
      this.saveIndicator.classList.remove('visible');
    }, 2000);
  }

  /**
   * Update last save time display
   */
  updateLastSaveTime() {
    if (!this.lastSaveTime) {
      this.lastSaveElement.textContent = 'Never';
      return;
    }

    const now = new Date();
    const diffMs = now - this.lastSaveTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    let timeText;
    if (diffMins < 1) {
      timeText = 'Just now';
    } else if (diffMins < 60) {
      timeText = `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      timeText = `${hours}h ago`;
    } else {
      timeText = this.lastSaveTime.toLocaleDateString();
    }
    
    this.lastSaveElement.textContent = timeText;
  }

  /**
   * Handle visibility change (tab switching)
   */
  handleVisibilityChange() {
    if (!document.hidden) {
      // Tab became visible, update last save time
      this.updateLastSaveTime();
    }
  }

  /**
   * Show error message to user
   */
  showError(message) {
    // Simple error display - could be enhanced with a toast system
    console.error(message);
    alert(message);
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  initializeTheme() {
    const savedTheme = localStorage.getItem('welltoodit-theme');
    let theme = savedTheme;
    
    if (!theme) {
      // Check system preference
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    this.setTheme(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('welltoodit-theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    this.setTheme(newTheme);
    localStorage.setItem('welltoodit-theme', newTheme);
    
    console.log(`🎨 Theme switched to: ${newTheme}`);
  }

  /**
   * Set theme and update UI
   */
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // The CSS handles the visual state change automatically
    // No need to update innerHTML as we're using CSS animations
    console.log(`🎨 Theme switched to: ${theme}`);
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S - Save (though auto-save handles this)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveNote();
        this.showSaveIndicator();
      }
      
      // Ctrl/Cmd + N - Clear note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.handleClearNote();
      }
      
      // Ctrl/Cmd + D - Download
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        this.handleDownload();
      }
      
      // Ctrl/Cmd + T - Toggle theme
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        this.toggleTheme();
      }
      
      // F11 - Toggle fullscreen (browser native, but we can enhance)
      if (e.key === 'F11') {
        // Let browser handle this naturally
      }
    });
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.welltooditApp = new WelltooditApp();
});

// Update last save time every minute
setInterval(() => {
  if (window.welltooditApp) {
    window.welltooditApp.updateLastSaveTime();
  }
}, 60000);