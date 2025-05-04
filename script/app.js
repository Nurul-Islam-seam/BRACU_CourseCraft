// Global variables
let courses = [];
let editingCourseIndex = null;
let editingCategoryIndex = null;
let editingLinkIndex = null;
let tempCategories = [];

// DOM Elements
const coursesGrid = document.getElementById('coursesGrid');
const modalOverlay = document.getElementById('modalOverlay');
const addCourseBtn = document.getElementById('addCourseBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const themeIcon = document.getElementById('themeIcon');

// Course Modal Elements
const courseModal = document.getElementById('courseModal');
const courseModalTitle = document.getElementById('courseModalTitle');
const courseForm = document.getElementById('courseForm');
const courseName = document.getElementById('courseName');
const courseIcon = document.getElementById('courseIcon');
const courseType = document.getElementById('courseType');
const regularCourseFields = document.getElementById('regularCourseFields');
const categoryCourseFields = document.getElementById('categoryCourseFields');
const courseUrl = document.getElementById('courseUrl');
const categoriesList = document.getElementById('categoriesList');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const saveCourseBtn = document.getElementById('saveCourseBtn');

// Category Modal Elements
const categoryModal = document.getElementById('categoryModal');
const categoryModalTitle = document.getElementById('categoryModalTitle');
const categoryName = document.getElementById('categoryName');
const linksList = document.getElementById('linksList');
const addLinkBtn = document.getElementById('addLinkBtn');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');

// Link Modal Elements
const linkModal = document.getElementById('linkModal');
const linkModalTitle = document.getElementById('linkModalTitle');
const linkName = document.getElementById('linkName');
const linkUrl = document.getElementById('linkUrl');
const saveLinkBtn = document.getElementById('saveLinkBtn');

// View Category Modal Elements
const viewCategoryModal = document.getElementById('viewCategoryModal');
const viewCategoryTitle = document.getElementById('viewCategoryTitle');
const viewCategoriesList = document.getElementById('viewCategoriesList');

// Confirm Delete Modal Elements
const confirmDeleteModal = document.getElementById('confirmDeleteModal');
const deleteMessage = document.getElementById('deleteMessage');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let deleteCallback = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadTheme();
    loadCoursesData();
    renderCourses();
    attachEventListeners();
}

// Theme handling
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// Data handling
async function loadCoursesData() {
    const storedData = localStorage.getItem('coursesData');
    
    if (storedData) {
        courses = JSON.parse(storedData);
    } else {
        try {
            const response = await fetch('data/courses.json');
            courses = await response.json();
            localStorage.setItem('coursesData', JSON.stringify(courses));
        } catch (error) {
            console.error('Error loading courses data:', error);
            courses = [];
        }
    }
}

function saveCoursesData() {
    localStorage.setItem('coursesData', JSON.stringify(courses));
    renderCourses();
}

// Course rendering
function renderCourses(searchTerm = '') {
    coursesGrid.innerHTML = '';
    
    const filteredCourses = searchTerm 
        ? courses.filter(course => course.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : courses;
    
    filteredCourses.forEach((course, index) => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.dataset.index = index;
        
        // Handle course icon (emoji or image URL)
        const courseIcon = document.createElement('div');
        courseIcon.className = 'course-icon';
        
        if (course.icon.startsWith('http') || course.icon.startsWith('data:')) {
            // It's an image URL
            const iconImg = document.createElement('img');
            iconImg.src = course.icon;
            iconImg.alt = course.name;
            iconImg.onerror = () => {
                // Fallback to a default emoji if image fails to load
                courseIcon.textContent = '📚';
            };
            courseIcon.appendChild(iconImg);
        } else {
            // It's an emoji or text
            courseIcon.textContent = course.icon;
        }
        
        const courseName = document.createElement('div');
        courseName.className = 'course-name';
        courseName.textContent = course.name;
        
        // Add card actions with edit and remove buttons
        const cardActions = document.createElement('div');
        cardActions.className = 'card-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the course
            showEditCourseModal(index);
        });
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the course
            deleteCourse(index);
        });
        
        cardActions.appendChild(editBtn);
        cardActions.appendChild(removeBtn);
        
        // Add a dedicated "Manage Categories" button for category courses
        if (!course.url && course.categories !== undefined) {
            const manageCategoriesBtn = document.createElement('button');
            manageCategoriesBtn.className = 'btn primary';
            manageCategoriesBtn.textContent = 'Manage Categories';
            manageCategoriesBtn.style.marginTop = '0.5rem';
            manageCategoriesBtn.style.width = '100%';
            manageCategoriesBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening the course
                showViewCategoryModal(course, index);
            });
            
            const btnContainer = document.createElement('div');
            btnContainer.style.width = '100%';
            btnContainer.appendChild(manageCategoriesBtn);
            
            courseCard.appendChild(courseIcon);
            courseCard.appendChild(courseName);
            courseCard.appendChild(cardActions);
            courseCard.appendChild(btnContainer);
        } else {
            courseCard.appendChild(courseIcon);
            courseCard.appendChild(courseName);
            courseCard.appendChild(cardActions);
        }
        
        courseCard.addEventListener('click', () => handleCourseClick(course, index));
        
        coursesGrid.appendChild(courseCard);
    });
}

// Handle clicking on a course card
function handleCourseClick(course, index) {
    if (course.url) {
        // Regular course - open URL in a new tab
        window.open(course.url, '_blank');
    } else if (course.categories) {
        // Category course - show simplified categories in a grid layout
        showCategoriesGridView(course, index);
    }
}

// New function for showing categories in a grid view when clicking on course
function showCategoriesGridView(course, index) {
    viewCategoryTitle.textContent = `${course.name} Categories`;
    viewCategoryModal.dataset.courseIndex = courses.indexOf(course);
    
    // Clear the view
    viewCategoriesList.innerHTML = '';
    
    const categories = course.categories || [];
    
    if (categories.length === 0) {
        const noCategoriesMsg = document.createElement('p');
        noCategoriesMsg.textContent = 'No categories have been added yet.';
        noCategoriesMsg.style.textAlign = 'center';
        noCategoriesMsg.style.fontStyle = 'italic';
        noCategoriesMsg.style.opacity = '0.7';
        viewCategoriesList.appendChild(noCategoriesMsg);
    } else {
        // Create a grid container for the category cards
        const gridContainer = document.createElement('div');
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        gridContainer.style.gap = '1rem';
        gridContainer.style.marginTop = '1rem';
        
        categories.forEach((category) => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'course-card';
            categoryCard.style.cursor = 'pointer';
            
            // Use first letter of category name as icon, possibly wrapped in a div for styling
            const categoryIcon = document.createElement('div');
            categoryIcon.className = 'course-icon';
            
            // Check if there's a custom icon in the future (could be added later)
            if (category.icon) {
                if (category.icon.startsWith('http') || category.icon.startsWith('data:')) {
                    // It's an image URL
                    const iconImg = document.createElement('img');
                    iconImg.src = category.icon;
                    iconImg.alt = category.name;
                    iconImg.onerror = () => {
                        // Fallback to first letter if image fails
                        categoryIcon.textContent = category.name.charAt(0).toUpperCase();
                    };
                    categoryIcon.appendChild(iconImg);
                } else {
                    // It's an emoji or text
                    categoryIcon.textContent = category.icon;
                }
            } else {
                // Default to first letter
                categoryIcon.textContent = category.name.charAt(0).toUpperCase();
            }
            
            const categoryName = document.createElement('div');
            categoryName.className = 'course-name';
            categoryName.textContent = category.name;
            
            // If category has links
            if (category.links && category.links.length > 0) {
                // Always use the first link as the destination
                const link = category.links[0];
                
                // Add link indicator
                const linkIndicator = document.createElement('div');
                linkIndicator.style.fontSize = '0.8rem';
                linkIndicator.style.color = 'var(--primary-color)';
                linkIndicator.style.opacity = '0.8';
                linkIndicator.textContent = link.name;
                
                categoryCard.addEventListener('click', () => {
                    window.open(link.url, '_blank');
                });
                
                categoryCard.appendChild(categoryIcon);
                categoryCard.appendChild(categoryName);
                categoryCard.appendChild(linkIndicator);
            } else {
                categoryCard.appendChild(categoryIcon);
                categoryCard.appendChild(categoryName);
                
                const noLinkMsg = document.createElement('div');
                noLinkMsg.textContent = 'No link added';
                noLinkMsg.style.fontSize = '0.8rem';
                noLinkMsg.style.fontStyle = 'italic';
                noLinkMsg.style.opacity = '0.6';
                categoryCard.appendChild(noLinkMsg);
            }
            
            gridContainer.appendChild(categoryCard);
        });
        
        viewCategoriesList.appendChild(gridContainer);
    }
    
    openModal(viewCategoryModal);
}

// Function for managing categories (when "Manage Categories" button is clicked)
function showViewCategoryModal(course, index) {
    viewCategoryTitle.textContent = `Manage ${course.name} Categories`;
    // Store the course index for editing
    viewCategoryModal.dataset.courseIndex = courses.indexOf(course);
    renderViewCategoriesList(course.categories || []);
    openModal(viewCategoryModal);
}

function renderViewCategoriesList(categories) {
    viewCategoriesList.innerHTML = '';
    
    // Create a styled container for the category management UI
    const managementContainer = document.createElement('div');
    managementContainer.style.padding = '1rem';
    managementContainer.style.borderRadius = '8px';
    managementContainer.style.backgroundColor = 'rgba(0,0,0,0.05)';
    managementContainer.style.marginBottom = '1.5rem';
    
    // Create a header for the management section
    const managementHeader = document.createElement('div');
    managementHeader.style.display = 'flex';
    managementHeader.style.justifyContent = 'space-between';
    managementHeader.style.alignItems = 'center';
    managementHeader.style.marginBottom = '1rem';
    
    const headerTitle = document.createElement('h3');
    headerTitle.style.margin = '0';
    headerTitle.style.fontWeight = '600';
    headerTitle.textContent = 'Add New Category';
    
    // Create a professional input group for adding categories
    const inputGroup = document.createElement('div');
    inputGroup.style.display = 'flex';
    inputGroup.style.gap = '0.5rem';
    inputGroup.style.marginTop = '0.5rem';
    
    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.placeholder = 'Category Name';
    categoryInput.style.padding = '0.5rem';
    categoryInput.style.border = '1px solid var(--input-border)';
    categoryInput.style.borderRadius = '4px';
    categoryInput.style.backgroundColor = 'var(--input-bg)';
    categoryInput.style.color = 'var(--text-color)';
    categoryInput.style.fontFamily = 'Orbitron, sans-serif';
    categoryInput.style.fontSize = '0.9rem';
    categoryInput.style.flexGrow = '1';
    
    const addBtn = document.createElement('button');
    addBtn.className = 'btn secondary';
    addBtn.textContent = 'Add';
    addBtn.addEventListener('click', () => {
        // Get the course we're viewing
        const courseIndex = parseInt(viewCategoryModal.dataset.courseIndex);
        if (isNaN(courseIndex)) return;
        
        const categoryName = categoryInput.value.trim();
        if (!categoryName) return;
        
        const course = courses[courseIndex];
        if (!course.categories) course.categories = [];
        
        // Add the new category without requiring links
        course.categories.push({
            name: categoryName,
            links: []
        });
        
        // Clear input and update
        categoryInput.value = '';
        saveCoursesData();
        renderViewCategoriesList(course.categories);
    });
    
    inputGroup.appendChild(categoryInput);
    inputGroup.appendChild(addBtn);
    
    managementHeader.appendChild(headerTitle);
    managementContainer.appendChild(managementHeader);
    managementContainer.appendChild(inputGroup);
    
    viewCategoriesList.appendChild(managementContainer);
    
    // Display existing categories
    if (categories.length === 0) {
        const noCategoriesMsg = document.createElement('p');
        noCategoriesMsg.textContent = 'No categories have been added yet.';
        noCategoriesMsg.style.textAlign = 'center';
        noCategoriesMsg.style.fontStyle = 'italic';
        noCategoriesMsg.style.opacity = '0.7';
        viewCategoriesList.appendChild(noCategoriesMsg);
        return;
    }
    
    categories.forEach((category, categoryIndex) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.style.marginBottom = '2rem';
        categorySection.style.border = '1px solid var(--card-border)';
        categorySection.style.borderRadius = '8px';
        categorySection.style.overflow = 'hidden';
        
        // Category header with actions - styled professionally
        const categoryHeader = document.createElement('div');
        categoryHeader.style.display = 'flex';
        categoryHeader.style.justifyContent = 'space-between';
        categoryHeader.style.alignItems = 'center';
        categoryHeader.style.padding = '0.75rem 1rem';
        categoryHeader.style.backgroundColor = 'var(--header-bg)';
        categoryHeader.style.color = 'var(--header-text)';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category.name;
        categoryTitle.style.margin = '0';
        categoryTitle.style.fontSize = '1.1rem';
        
        const categoryActions = document.createElement('div');
        categoryActions.className = 'category-actions';
        
        // Edit category button
        const editCategoryBtn = document.createElement('button');
        editCategoryBtn.className = 'btn secondary';
        editCategoryBtn.textContent = 'Edit';
        editCategoryBtn.style.padding = '0.25rem 0.5rem';
        editCategoryBtn.style.fontSize = '0.8rem';
        editCategoryBtn.style.marginRight = '0.5rem';
        editCategoryBtn.addEventListener('click', () => {
            const courseIndex = parseInt(viewCategoryModal.dataset.courseIndex);
            if (isNaN(courseIndex)) return;
            
            // More professional edit with an input field
            const currentName = category.name;
            categoryTitle.innerHTML = '';
            
            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.value = currentName;
            editInput.style.padding = '0.25rem 0.5rem';
            editInput.style.borderRadius = '4px';
            editInput.style.border = '1px solid var(--input-border)';
            editInput.style.backgroundColor = 'var(--input-bg)';
            editInput.style.color = 'var(--text-color)';
            editInput.style.fontFamily = 'Orbitron, sans-serif';
            editInput.style.width = '180px';
            
            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn primary';
            saveBtn.textContent = 'Save';
            saveBtn.style.padding = '0.25rem 0.5rem';
            saveBtn.style.fontSize = '0.8rem';
            saveBtn.style.marginLeft = '0.5rem';
            
            saveBtn.addEventListener('click', () => {
                const newName = editInput.value.trim();
                if (!newName) return;
                
                // Update category name
                const course = courses[courseIndex];
                course.categories[categoryIndex].name = newName;
                
                // Save and rerender
                saveCoursesData();
                renderViewCategoriesList(course.categories);
            });
            
            categoryTitle.appendChild(editInput);
            categoryTitle.appendChild(saveBtn);
            editInput.focus();
        });
        
        // Remove category button
        const removeCategoryBtn = document.createElement('button');
        removeCategoryBtn.className = 'btn danger';
        removeCategoryBtn.textContent = 'Remove';
        removeCategoryBtn.style.padding = '0.25rem 0.5rem';
        removeCategoryBtn.style.fontSize = '0.8rem';
        removeCategoryBtn.addEventListener('click', () => {
            const courseIndex = parseInt(viewCategoryModal.dataset.courseIndex);
            if (isNaN(courseIndex)) return;
            
            // Confirm and delete the category
            showConfirmDeleteModal(
                `Are you sure you want to delete the category "${category.name}"?`,
                () => {
                    const course = courses[courseIndex];
                    course.categories.splice(categoryIndex, 1);
                    saveCoursesData();
                    
                    // Re-render the view modal with updated data
                    renderViewCategoriesList(course.categories || []);
                }
            );
        });
        
        categoryActions.appendChild(editCategoryBtn);
        categoryActions.appendChild(removeCategoryBtn);
        
        categoryHeader.appendChild(categoryTitle);
        categoryHeader.appendChild(categoryActions);
        
        // Links section - styled more professionally
        const linksContainer = document.createElement('div');
        linksContainer.style.padding = '1rem';
        
        // Create a nice header for links section
        const linksHeader = document.createElement('div');
        linksHeader.style.display = 'flex';
        linksHeader.style.justifyContent = 'space-between';
        linksHeader.style.alignItems = 'center';
        linksHeader.style.marginBottom = '1rem';
        linksHeader.style.paddingBottom = '0.5rem';
        linksHeader.style.borderBottom = '1px dashed var(--input-border)';
        
        const linksTitle = document.createElement('h4');
        linksTitle.textContent = 'Links';
        linksTitle.style.margin = '0';
        linksTitle.style.fontWeight = '500';
        
        // Professional link input group
        const linkInputGroup = document.createElement('div');
        linkInputGroup.style.display = 'flex';
        linkInputGroup.style.flexWrap = 'wrap';
        linkInputGroup.style.gap = '0.5rem';
        linkInputGroup.style.marginTop = '0.75rem';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Link Name';
        nameInput.style.padding = '0.5rem';
        nameInput.style.border = '1px solid var(--input-border)';
        nameInput.style.borderRadius = '4px';
        nameInput.style.backgroundColor = 'var(--input-bg)';
        nameInput.style.color = 'var(--text-color)';
        nameInput.style.fontFamily = 'Orbitron, sans-serif';
        nameInput.style.fontSize = '0.9rem';
        nameInput.style.minWidth = '120px';
        nameInput.style.flex = '1';
        
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = 'URL';
        urlInput.style.padding = '0.5rem';
        urlInput.style.border = '1px solid var(--input-border)';
        urlInput.style.borderRadius = '4px';
        urlInput.style.backgroundColor = 'var(--input-bg)';
        urlInput.style.color = 'var(--text-color)';
        urlInput.style.fontFamily = 'Orbitron, sans-serif';
        urlInput.style.fontSize = '0.9rem';
        urlInput.style.minWidth = '180px';
        urlInput.style.flex = '3';
        
        const addLinkBtn = document.createElement('button');
        addLinkBtn.className = 'btn primary';
        addLinkBtn.textContent = 'Set Link';
        addLinkBtn.style.padding = '0.5rem';
        
        // Only allow one link per category
        const hasLink = category.links && category.links.length > 0;
        
        if (hasLink) {
            addLinkBtn.textContent = 'Update Link';
        }
        
        addLinkBtn.addEventListener('click', () => {
            const courseIndex = parseInt(viewCategoryModal.dataset.courseIndex);
            if (isNaN(courseIndex)) return;
            
            const linkNameValue = nameInput.value.trim();
            const linkUrlValue = urlInput.value.trim();
            
            if (!linkNameValue || !linkUrlValue) return;
            
            // Set the link (replacing any existing link)
            const course = courses[courseIndex];
            course.categories[categoryIndex].links = [{
                name: linkNameValue,
                url: linkUrlValue
            }];
            
            // Clear inputs and update
            nameInput.value = '';
            urlInput.value = '';
            saveCoursesData();
            renderViewCategoriesList(course.categories);
        });
        
        linkInputGroup.appendChild(nameInput);
        linkInputGroup.appendChild(urlInput);
        linkInputGroup.appendChild(addLinkBtn);
        
        // Add link title and input group to the header
        linksHeader.appendChild(linksTitle);
        
        linksContainer.appendChild(linksHeader);
        linksContainer.appendChild(linkInputGroup);
        
        // List of links
        const linksList = document.createElement('div');
        linksList.className = 'links-list';
        linksList.style.marginTop = '1rem';
        
        if (!category.links || category.links.length === 0) {
            const noLinksMsg = document.createElement('p');
            noLinksMsg.textContent = 'No link has been added to this category.';
            noLinksMsg.style.fontStyle = 'italic';
            noLinksMsg.style.opacity = '0.7';
            noLinksMsg.style.textAlign = 'center';
            noLinksMsg.style.margin = '1rem 0';
            linksList.appendChild(noLinksMsg);
        } else {
            // Single link display with edit/delete options
            const link = category.links[0]; // Always use first link
            
            const linkContainer = document.createElement('div');
            linkContainer.style.display = 'flex';
            linkContainer.style.justifyContent = 'space-between';
            linkContainer.style.alignItems = 'center';
            linkContainer.style.padding = '0.75rem';
            linkContainer.style.backgroundColor = 'var(--card-bg)';
            linkContainer.style.borderRadius = '4px';
            linkContainer.style.border = '1px solid var(--card-border)';
            
            const linkInfo = document.createElement('div');
            linkInfo.style.flexGrow = '1';
            
            const linkName = document.createElement('div');
            linkName.textContent = link.name;
            linkName.style.fontWeight = '500';
            linkName.style.marginBottom = '0.25rem';
            
            const linkUrl = document.createElement('a');
            linkUrl.href = link.url;
            linkUrl.target = '_blank';
            linkUrl.textContent = link.url;
            linkUrl.style.fontSize = '0.8rem';
            linkUrl.style.color = 'var(--primary-color)';
            linkUrl.style.textDecoration = 'none';
            linkUrl.style.fontFamily = 'monospace';
            
            linkInfo.appendChild(linkName);
            linkInfo.appendChild(linkUrl);
            
            const linkActions = document.createElement('div');
            linkActions.style.display = 'flex';
            linkActions.style.gap = '0.5rem';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn secondary';
            editBtn.textContent = 'Edit';
            editBtn.style.padding = '0.25rem 0.5rem';
            editBtn.style.fontSize = '0.75rem';
            
            editBtn.addEventListener('click', () => {
                // Pre-fill the inputs with current link data
                nameInput.value = link.name;
                urlInput.value = link.url;
                // Focus on the name field for easy editing
                nameInput.focus();
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.padding = '0.25rem 0.5rem';
            deleteBtn.style.fontSize = '0.75rem';
            
            deleteBtn.addEventListener('click', () => {
                const courseIndex = parseInt(viewCategoryModal.dataset.courseIndex);
                if (isNaN(courseIndex)) return;
                
                showConfirmDeleteModal(
                    `Are you sure you want to delete the link "${link.name}"?`,
                    () => {
                        const course = courses[courseIndex];
                        course.categories[categoryIndex].links = [];
                        saveCoursesData();
                        renderViewCategoriesList(course.categories);
                    }
                );
            });
            
            linkActions.appendChild(editBtn);
            linkActions.appendChild(deleteBtn);
            
            linkContainer.appendChild(linkInfo);
            linkContainer.appendChild(linkActions);
            
            linksList.appendChild(linkContainer);
        }
        
        linksContainer.appendChild(linksList);
        
        categorySection.appendChild(categoryHeader);
        categorySection.appendChild(linksContainer);
        
        viewCategoriesList.appendChild(categorySection);
    });
}

// Modal functions
function openModal(modal) {
    modal.classList.remove('hidden');
    modalOverlay.classList.remove('hidden');
}

// Icon Tray Functions
function initIconTray() {
    const showIconTrayBtn = document.getElementById('showIconTrayBtn');
    const iconTray = document.getElementById('iconTray');
    const iconTabs = document.querySelectorAll('.icon-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const emojis = document.querySelectorAll('.emoji');
    const customIconUrl = document.getElementById('customIconUrl');
    const customIconPreview = document.getElementById('customIconPreview');
    const useCustomIconBtn = document.getElementById('useCustomIconBtn');
    
    // Toggle icon tray visibility
    if (showIconTrayBtn) {
        showIconTrayBtn.addEventListener('click', () => {
            iconTray.classList.toggle('hidden');
        });
    }
    
    // Tab switching
    iconTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            iconTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            const tabId = `${tab.dataset.tab}Tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Emoji selection
    emojis.forEach(emoji => {
        emoji.addEventListener('click', () => {
            document.getElementById('courseIcon').value = emoji.textContent;
            iconTray.classList.add('hidden');
        });
    });
    
    // Custom icon URL preview
    if (customIconUrl) {
        customIconUrl.addEventListener('input', () => {
            const url = customIconUrl.value.trim();
            if (url) {
                customIconPreview.src = url;
                customIconPreview.style.display = 'block';
                customIconPreview.onerror = () => {
                    customIconPreview.style.display = 'none';
                    customIconPreview.src = '';
                };
            } else {
                customIconPreview.style.display = 'none';
                customIconPreview.src = '';
            }
        });
    }
    
    // Use custom icon
    if (useCustomIconBtn) {
        useCustomIconBtn.addEventListener('click', () => {
            const url = customIconUrl.value.trim();
            if (url) {
                document.getElementById('courseIcon').value = url;
                iconTray.classList.add('hidden');
            }
        });
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.add('hidden'));
    modalOverlay.classList.add('hidden');
    resetForms();
}

function resetForms() {
    courseForm.reset();
    if (document.getElementById('categoryForm')) {
        document.getElementById('categoryForm').reset();
    }
    if (document.getElementById('linkForm')) {
        document.getElementById('linkForm').reset();
    }
    tempCategories = [];
    editingCourseIndex = null;
    editingCategoryIndex = null;
    editingLinkIndex = null;
}

// Course Modal
function showAddCourseModal() {
    courseModalTitle.textContent = 'Add Course';
    categoriesList.innerHTML = '';
    tempCategories = [];
    regularCourseFields.classList.remove('hidden');
    categoryCourseFields.classList.add('hidden');
    courseType.value = 'regular';
    openModal(courseModal);
}

function showEditCourseModal(index) {
    courseModalTitle.textContent = 'Edit Course';
    editingCourseIndex = index;
    const course = courses[index];
    
    courseName.value = course.name;
    courseIcon.value = course.icon;
    
    if (course.url) {
        courseType.value = 'regular';
        courseUrl.value = course.url;
        regularCourseFields.classList.remove('hidden');
        categoryCourseFields.classList.add('hidden');
    } else {
        courseType.value = 'category';
        tempCategories = [...(course.categories || [])];
        regularCourseFields.classList.add('hidden');
        categoryCourseFields.classList.remove('hidden');
        renderCategoriesList();
    }
    
    openModal(courseModal);
}

function toggleCourseTypeFields() {
    if (courseType.value === 'regular') {
        regularCourseFields.classList.remove('hidden');
        categoryCourseFields.classList.add('hidden');
    } else {
        regularCourseFields.classList.add('hidden');
        categoryCourseFields.classList.remove('hidden');
    }
}

function renderCategoriesList() {
    categoriesList.innerHTML = '';
    
    tempCategories.forEach((category, index) => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        
        const categoryNameElem = document.createElement('div');
        categoryNameElem.textContent = category.name;
        
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.addEventListener('click', () => showEditCategoryModal(index));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.className = 'delete-action';
        deleteBtn.addEventListener('click', () => {
            showConfirmDeleteModal(
                `Are you sure you want to delete the category "${category.name}"?`, 
                () => {
                    tempCategories.splice(index, 1);
                    renderCategoriesList();
                }
            );
        });
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        categoryItem.appendChild(categoryNameElem);
        categoryItem.appendChild(actions);
        categoriesList.appendChild(categoryItem);
    });
}

function saveCourse() {
    const name = courseName.value.trim();
    const icon = courseIcon.value.trim();
    
    if (!name || !icon) {
        alert('Please fill in all required fields');
        return;
    }
    
    const courseData = {
        name,
        icon
    };
    
    if (courseType.value === 'regular') {
        const url = courseUrl.value.trim();
        if (!url) {
            alert('Please provide a URL for the regular course');
            return;
        }
        courseData.url = url;
    } else {
        // For category courses, initialize with empty categories array if none exist
        courseData.categories = tempCategories.length > 0 ? [...tempCategories] : [];
        // Remove the validation that requires at least one category
    }
    
    if (editingCourseIndex !== null) {
        courses[editingCourseIndex] = courseData;
    } else {
        courses.push(courseData);
    }
    
    saveCoursesData();
    closeAllModals();
}

// Category Modal
function showAddCategoryModal() {
    categoryModalTitle.textContent = 'Add Category';
    categoryName.value = '';
    linksList.innerHTML = '';
    editingCategoryIndex = null;
    openModal(categoryModal);
}

function showEditCategoryModal(index) {
    categoryModalTitle.textContent = 'Edit Category';
    editingCategoryIndex = index;
    const category = tempCategories[index];
    
    categoryName.value = category.name;
    renderLinksList(category.links || []);
    
    openModal(categoryModal);
}

function renderLinksList(links = []) {
    linksList.innerHTML = '';
    
    if (links.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No links added yet.';
        emptyMessage.style.fontStyle = 'italic';
        emptyMessage.style.opacity = '0.7';
        emptyMessage.style.margin = '0.5rem 0';
        linksList.appendChild(emptyMessage);
    }
    
    links.forEach((link, index) => {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        
        const linkNameElem = document.createElement('div');
        linkNameElem.textContent = `${link.name} (${link.url})`;
        
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.addEventListener('click', () => showEditLinkModal(index));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.className = 'delete-action';
        deleteBtn.addEventListener('click', () => {
            const currentLinks = tempCategories[editingCategoryIndex].links || [];
            showConfirmDeleteModal(
                `Are you sure you want to delete the link "${link.name}"?`, 
                () => {
                    currentLinks.splice(index, 1);
                    tempCategories[editingCategoryIndex].links = currentLinks;
                    renderLinksList(currentLinks);
                }
            );
        });
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        linkItem.appendChild(linkNameElem);
        linkItem.appendChild(actions);
        linksList.appendChild(linkItem);
    });
}

function saveCategory() {
    const name = categoryName.value.trim();
    
    if (!name) {
        alert('Please enter a category name');
        return;
    }
    
    const categoryData = {
        name,
        links: []
    };
    
    if (editingCategoryIndex !== null) {
        // Edit existing category - preserve links
        categoryData.links = tempCategories[editingCategoryIndex].links || [];
        tempCategories[editingCategoryIndex] = categoryData;
    } else {
        // Add new category without requiring links
        tempCategories.push(categoryData);
    }
    
    renderCategoriesList();
    closeAllModals();
}

// Link Modal
function showAddLinkModal() {
    linkModalTitle.textContent = 'Add Link';
    linkName.value = '';
    linkUrl.value = '';
    editingLinkIndex = null;
    openModal(linkModal);
}

function showEditLinkModal(index) {
    linkModalTitle.textContent = 'Edit Link';
    editingLinkIndex = index;
    
    const links = tempCategories[editingCategoryIndex].links || [];
    const link = links[index];
    
    linkName.value = link.name;
    linkUrl.value = link.url;
    
    openModal(linkModal);
}

function saveLink() {
    const name = linkName.value.trim();
    const url = linkUrl.value.trim();
    
    if (!name || !url) {
        alert('Please fill in all link fields');
        return;
    }
    
    const linkData = { name, url };
    
    if (!tempCategories[editingCategoryIndex].links) {
        tempCategories[editingCategoryIndex].links = [];
    }
    
    if (editingLinkIndex !== null) {
        tempCategories[editingCategoryIndex].links[editingLinkIndex] = linkData;
    } else {
        tempCategories[editingCategoryIndex].links.push(linkData);
    }
    
    renderLinksList(tempCategories[editingCategoryIndex].links);
    closeAllModals();
}

// Confirm Delete Modal
function showConfirmDeleteModal(message, onConfirm) {
    deleteMessage.textContent = message;
    deleteCallback = onConfirm;
    openModal(confirmDeleteModal);
}

function handleDeleteConfirm() {
    if (typeof deleteCallback === 'function') {
        deleteCallback();
    }
    closeAllModals();
}

function deleteCourse(index) {
    showConfirmDeleteModal(
        `Are you sure you want to delete "${courses[index].name}"?`,
        () => {
            courses.splice(index, 1);
            saveCoursesData();
        }
    );
}

// Search functionality
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    renderCourses(searchTerm);
}

// Event listeners
function attachEventListeners() {
    // Main controls
    addCourseBtn.addEventListener('click', showAddCourseModal);
    toggleThemeBtn.addEventListener('click', toggleTheme);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('input', handleSearch);
    
    // Modal controls
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    modalOverlay.addEventListener('click', closeAllModals);
    
    // Course type toggle
    courseType.addEventListener('change', toggleCourseTypeFields);
    
    // Form buttons
    saveCourseBtn.addEventListener('click', saveCourse);
    saveCategoryBtn.addEventListener('click', saveCategory);
    saveLinkBtn.addEventListener('click', saveLink);
    confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    
    // Category buttons
    addCategoryBtn.addEventListener('click', showAddCategoryModal);
    addLinkBtn.addEventListener('click', showAddLinkModal);
    
    // Prevent form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', e => e.preventDefault());
    });
    
    // Initialize icon tray
    initIconTray();
}