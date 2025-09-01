// CBSE Kids Study App - Main Application Logic

class StudyApp {
    constructor() {
        this.currentPage = 'welcome-page';
        this.selectedClass = null;
        this.selectedSubject = null;
        this.selectedCategory = null;
        
        this.init();
    }
    
    init() {
        // Load user preferences
        this.loadUserPreferences();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize the app based on saved preferences
        this.initializeApp();
        
        console.log('🎓 CBSE Study App initialized successfully!');
    }
    
    loadUserPreferences() {
        this.selectedClass = StudyAppData.userPreferences.selectedClass;
        this.selectedSubject = StudyAppData.userPreferences.selectedSubject;
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            this.handleRouteChange();
        });
        
        // Handle hash changes for routing
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });
    }
    
    initializeApp() {
        // Check if user has preferences and navigate accordingly
        if (this.selectedClass && this.selectedSubject) {
            this.navigateTo('content-view');
        } else if (this.selectedClass) {
            this.navigateTo('subject-selection');
        } else {
            this.navigateTo('welcome-page');
        }
    }
    
    // Navigation system
    navigateTo(pageId, updateHistory = true) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            
            // Update URL hash
            if (updateHistory) {
                const hash = this.getHashForPage(pageId);
                window.location.hash = hash;
            }
            
            // Update breadcrumb
            this.updateBreadcrumb();
            
            // Initialize page-specific content
            this.initializePage(pageId);
        }
    }
    
    getHashForPage(pageId) {
        switch (pageId) {
            case 'welcome-page':
                return '#home';
            case 'class-selection':
                return '#classes';
            case 'subject-selection':
                return `#class-${this.selectedClass}`;
            case 'content-view':
                return `#class-${this.selectedClass}/subject-${this.selectedSubject}`;
            default:
                return '#home';
        }
    }
    
    handleRouteChange() {
        const hash = window.location.hash.slice(1); // Remove #
        
        if (!hash || hash === 'home') {
            this.navigateTo('welcome-page', false);
        } else if (hash === 'classes') {
            this.navigateTo('class-selection', false);
        } else if (hash.startsWith('class-')) {
            const parts = hash.split('/');
            const classMatch = parts[0].match(/class-(\d+)/);
            
            if (classMatch) {
                const classId = parseInt(classMatch[1]);
                this.selectClass(classId);
                
                if (parts[1] && parts[1].startsWith('subject-')) {
                    const subjectMatch = parts[1].match(/subject-(.+)/);
                    if (subjectMatch) {
                        this.selectSubject(subjectMatch[1]);
                    }
                }
            }
        }
    }
    
    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;
        
        let breadcrumbHTML = '';
        let showBreadcrumb = false;
        
        // Build breadcrumb based on current state
        if (this.currentPage === 'welcome-page') {
            breadcrumbHTML = '<span class="breadcrumb-item active">Home</span>';
        } else {
            showBreadcrumb = true;
            breadcrumbHTML = '<span class="breadcrumb-item" onclick="app.navigateTo(\'welcome-page\')">Home</span>';
            
            if (this.currentPage === 'class-selection') {
                breadcrumbHTML += '<span class="breadcrumb-item active">Classes</span>';
            } else if (this.selectedClass) {
                breadcrumbHTML += '<span class="breadcrumb-item" onclick="app.navigateTo(\'class-selection\')">Classes</span>';
                breadcrumbHTML += `<span class="breadcrumb-item${this.currentPage === 'subject-selection' ? ' active' : ''}" onclick="app.selectClass(${this.selectedClass})">${StudyAppData.classes[this.selectedClass]?.name || 'Class'}</span>`;
                
                if (this.selectedSubject && this.currentPage === 'content-view') {
                    const subjectData = StudyAppData.getSubjectContent(this.selectedClass, this.selectedSubject);
                    breadcrumbHTML += `<span class="breadcrumb-item active">${subjectData?.name || 'Subject'}</span>`;
                }
            }
        }
        
        breadcrumb.innerHTML = breadcrumbHTML;
        breadcrumb.style.display = showBreadcrumb ? 'flex' : 'none';
    }
    
    initializePage(pageId) {
        switch (pageId) {
            case 'subject-selection':
                this.populateSubjects();
                break;
            case 'content-view':
                this.populateContent();
                break;
        }
    }
    
    // Class selection
    selectClass(classId) {
        this.selectedClass = classId;
        this.selectedSubject = null;
        this.selectedCategory = null;
        
        StudyAppData.setSelectedClass(classId);
        
        this.navigateTo('subject-selection');
    }
    
    populateSubjects() {
        const container = document.getElementById('subjects-container');
        if (!container || !this.selectedClass) return;
        
        const subjects = StudyAppData.getClassSubjects(this.selectedClass);
        
        container.innerHTML = subjects.map(subject => {
            const contentCount = StudyAppData.getContentItems(this.selectedClass, subject.id).length;
            
            return `
                <div class="subject-card" onclick="app.selectSubject('${subject.id}')">
                    <div class="subject-icon">${subject.icon}</div>
                    <h3>${subject.name}</h3>
                    <p>${subject.description}</p>
                    <div class="tips-count">${contentCount} Tips & Tricks</div>
                    <button class="btn btn-primary">Explore ${subject.name}</button>
                </div>
            `;
        }).join('');
    }
    
    // Subject selection
    selectSubject(subjectId) {
        this.selectedSubject = subjectId;
        this.selectedCategory = null;
        
        StudyAppData.setSelectedSubject(subjectId);
        
        this.navigateTo('content-view');
    }
    
    populateContent() {
        if (!this.selectedClass || !this.selectedSubject) return;
        
        const subjectData = StudyAppData.getSubjectContent(this.selectedClass, this.selectedSubject);
        if (!subjectData) return;
        
        // Update page title
        const titleElement = document.getElementById('content-title');
        if (titleElement) {
            titleElement.innerHTML = `${subjectData.icon} ${subjectData.name} - Class ${this.selectedClass}`;
        }
        
        // Populate categories
        this.populateCategories();
        
        // Populate content items
        this.populateContentItems();
    }
    
    populateCategories() {
        const container = document.getElementById('content-categories');
        if (!container) return;
        
        const subjectData = StudyAppData.getSubjectContent(this.selectedClass, this.selectedSubject);
        const categories = Object.keys(subjectData.content);
        
        // Add "All" category
        let categoriesHTML = `
            <button class="category-btn ${!this.selectedCategory ? 'active' : ''}" 
                    onclick="app.filterByCategory(null)">
                All Tips
            </button>
        `;
        
        // Add specific categories
        categoriesHTML += categories.map(category => `
            <button class="category-btn ${this.selectedCategory === category ? 'active' : ''}" 
                    onclick="app.filterByCategory('${category}')">
                ${category}
            </button>
        `).join('');
        
        container.innerHTML = categoriesHTML;
    }
    
    populateContentItems(searchResults = null) {
        const container = document.getElementById('content-list');
        if (!container) return;
        
        let items;
        
        if (searchResults) {
            // Display search results
            items = searchResults.map(result => result.item);
        } else {
            // Display content for current subject and category
            items = StudyAppData.getContentItems(this.selectedClass, this.selectedSubject, this.selectedCategory);
        }
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="content-item">
                    <h3>🔍 No content found</h3>
                    <p>Try adjusting your search or selecting a different category.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div class="content-item">
                <h3>
                    ${item.title}
                    <span class="category-tag">${item.category}</span>
                </h3>
                <p>${item.content}</p>
                ${item.highlight ? `<div class="tip-highlight">💡 ${item.highlight}</div>` : ''}
            </div>
        `).join('');
    }
    
    // Category filtering
    filterByCategory(category) {
        this.selectedCategory = category;
        this.populateCategories();
        this.populateContentItems();
        
        // Clear search when filtering by category
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
    }
    
    // Search functionality
    handleSearch(query) {
        if (!query || query.trim().length < 2) {
            // Show all content when search is cleared
            this.populateContentItems();
            return;
        }
        
        const results = StudyAppData.search(query.trim());
        
        // Filter results to current class and subject if we're in content view
        let filteredResults = results;
        if (this.selectedClass && this.selectedSubject) {
            filteredResults = results.filter(result => 
                result.classId == this.selectedClass && 
                result.subjectId === this.selectedSubject
            );
        }
        
        this.populateContentItems(filteredResults);
        
        // Update categories to show "Search Results"
        const container = document.getElementById('content-categories');
        if (container) {
            container.innerHTML = `
                <button class="category-btn active">
                    Search Results (${filteredResults.length})
                </button>
                <button class="category-btn" onclick="app.clearSearch()">
                    Clear Search
                </button>
            `;
        }
    }
    
    clearSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        this.populateCategories();
        this.populateContentItems();
    }
    
    // Utility methods
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Method to get app statistics for debugging
    getAppStats() {
        const totalContent = Object.values(StudyAppData.classes).reduce((total, classData) => {
            return total + Object.values(classData.subjects).reduce((subjectTotal, subject) => {
                return subjectTotal + Object.values(subject.content).reduce((categoryTotal, items) => {
                    return categoryTotal + items.length;
                }, 0);
            }, 0);
        }, 0);
        
        return {
            totalClasses: Object.keys(StudyAppData.classes).length,
            totalSubjects: Object.values(StudyAppData.classes).reduce((total, classData) => {
                return total + Object.keys(classData.subjects).length;
            }, 0),
            totalContent: totalContent,
            searchIndexSize: Object.keys(StudyAppData.searchIndex).length,
            currentUser: {
                selectedClass: this.selectedClass,
                selectedSubject: this.selectedSubject,
                currentPage: this.currentPage
            }
        };
    }
}

// Global navigation functions (called from HTML)
function navigateTo(pageId) {
    if (window.app) {
        window.app.navigateTo(pageId);
    }
}

function selectClass(classId) {
    if (window.app) {
        window.app.selectClass(classId);
    }
}

function selectSubject(subjectId) {
    if (window.app) {
        window.app.selectSubject(subjectId);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        font-family: var(--font-primary);
        font-weight: 600;
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudyApp();
    
    // Add some helpful console messages for developers
    console.log('🎓 CBSE Kids Study App');
    console.log('📊 App Statistics:', window.app.getAppStats());
    console.log('🔧 Access app instance via window.app');
    console.log('💡 Try app.getAppStats() for detailed statistics');
});

// Handle page visibility change to save preferences
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.app) {
        StudyAppData.saveUserPreferences();
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyApp;
}