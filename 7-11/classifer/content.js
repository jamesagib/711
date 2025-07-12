// YouTube Video Classifier Content Script

class YouTubeClassifier {
    constructor() {
        this.categories = ["Entertainment", "Study", "Motivation", "How To", "Money & Career", "Gaming", "Poltics"];
        this.classifiedVideos = [];
        this.isInterfaceVisible = false;
        this.init();
    }

    init() {
        // Wait for YouTube to load
        this.waitForYouTube();
        this.createClassifyButton();
        this.createClassificationInterface();
    }

    waitForYouTube() {
        const checkInterval = setInterval(() => {
            // Check for both video pages and homepage/search results
            if (document.querySelector('#title h1') || document.querySelector('#video-title') || 
                document.querySelector('ytd-rich-item-renderer') || document.querySelector('#video-title-link')) {
                clearInterval(checkInterval);
                this.setupEventListeners();
                this.makeAllVideosDraggable();
            }
        }, 1000);
    }

    createClassifyButton() {
        const button = document.createElement('button');
        button.id = 'classify-btn';
        button.textContent = 'Classify';
        button.className = 'classify-button';
        document.body.appendChild(button);

        button.addEventListener('click', () => {
            this.toggleClassificationInterface();
        });
    }

    createClassificationInterface() {
        const classificationPanel = document.createElement('div');
        classificationPanel.id = 'classification-interface';
        classificationPanel.className = 'classification-interface hidden';
        
        const header = document.createElement('div');
        header.className = 'interface-header';
        header.innerHTML = '<div class="drag-handle">⋮⋮</div><h3>Classify Video</h3><div class="header-buttons"><button id="export-btn">Export</button><button id="close-btn">×</button></div>';
        
        const videoInfo = document.createElement('div');
        videoInfo.id = 'video-info';
        videoInfo.className = 'video-info';
        
        const categoriesContainer = document.createElement('div');
        categoriesContainer.className = 'categories-container';
        
        this.categories.forEach(category => {
            const categoryBin = document.createElement('div');
            categoryBin.className = 'category-bin';
            categoryBin.dataset.category = category;
            categoryBin.innerHTML = `
                <h4>${category}</h4>
                <div class="bin-content" data-category="${category}"></div>
            `;
            categoriesContainer.appendChild(categoryBin);
        });
        
        classificationPanel.appendChild(header);
        classificationPanel.appendChild(videoInfo);
        classificationPanel.appendChild(categoriesContainer);
        
        document.body.appendChild(classificationPanel);
        
        // Make the interface draggable
        this.makeInterfaceDraggable(classificationPanel);
        
        // Close button event
        document.getElementById('close-btn').addEventListener('click', () => {
            this.toggleClassificationInterface();
        });
        
        // Export button event
        document.getElementById('export-btn').addEventListener('click', () => {
            this.showExportPopup();
        });
    }

    makeInterfaceDraggable(classificationPanel) {
        let isDragging = false;
        let startX;
        let startY;
        let initialX = 0;
        let initialY = 0;

        const dragHandle = classificationPanel.querySelector('.drag-handle');
        
        dragHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            classificationPanel.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                const newX = initialX + deltaX;
                const newY = initialY + deltaY;

                // Constrain to viewport
                const rect = classificationPanel.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                
                const constrainedX = Math.max(0, Math.min(newX, maxX));
                const constrainedY = Math.max(0, Math.min(newY, maxY));

                classificationPanel.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                classificationPanel.style.cursor = 'default';
                
                // Update initial position for next drag
                const currentTransform = classificationPanel.style.transform;
                const match = currentTransform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
                if (match) {
                    initialX = parseFloat(match[1]);
                    initialY = parseFloat(match[2]);
                }
            }
        });

        // Touch events for mobile
        dragHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                const touch = e.touches[0];
                
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;
                
                const newX = initialX + deltaX;
                const newY = initialY + deltaY;

                // Constrain to viewport
                const rect = classificationPanel.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                
                const constrainedX = Math.max(0, Math.min(newX, maxX));
                const constrainedY = Math.max(0, Math.min(newY, maxY));

                classificationPanel.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
            }
        });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                
                // Update initial position for next drag
                const currentTransform = classificationPanel.style.transform;
                const match = currentTransform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
                if (match) {
                    initialX = parseFloat(match[1]);
                    initialY = parseFloat(match[2]);
                }
            }
        });
    }

    toggleClassificationInterface() {
        const classificationPanel = document.getElementById('classification-interface');
        const button = document.getElementById('classify-btn');
        
        if (this.isInterfaceVisible) {
            classificationPanel.classList.add('hidden');
            button.classList.remove('active');
            this.isInterfaceVisible = false;
        } else {
            classificationPanel.classList.remove('hidden');
            button.classList.add('active');
            this.isInterfaceVisible = true;
            this.updateVideoInfo();
        }
    }

        updateVideoInfo() {
        const videoInfo = document.getElementById('video-info');
        const videoData = this.getCurrentVideoData();
        
        if (videoData) {
            videoInfo.innerHTML = `
                <div class="video-card" draggable="true" data-video-id="${videoData.id}">
                    <h4>${videoData.title}</h4>
                    <p>${videoData.description}</p>
                </div>
            `;
            
            console.log(videoInfo);
            
            // Make video card draggable
            const videoCard = videoInfo.querySelector('.video-card');
            this.setupDragAndDrop(videoCard);
        }
    }

    makeAllVideosDraggable() {
        // Find all video cards on the page
        const videoCards = document.querySelectorAll('ytd-rich-item-renderer');
        
        videoCards.forEach((card, index) => {
            // Make each video card draggable
            card.setAttribute('draggable', 'true');
            card.classList.add('draggable-video-card');
            
            // Add visual feedback
            card.style.cursor = 'grab';
            card.style.transition = 'all 0.3s ease';
            
            // Add drag event listeners
            card.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                const videoData = this.extractVideoDataFromCard(card);
                if (videoData) {
                    e.dataTransfer.setData('application/json', JSON.stringify(videoData));
                    card.style.opacity = '0.5';
                    card.style.transform = 'scale(0.95)';
                }
            });
            
            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            });
            
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.02)';
                card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = 'none';
            });
        });
        
        // Setup drop zones for the classification interface
        this.setupClassificationDropZones();
    }

    extractVideoDataFromCard(card) {
        try {
            // Extract title
            const titleElement = card.querySelector('#video-title') || card.querySelector('#video-title-link yt-formatted-string');
            const title = titleElement ? titleElement.textContent.trim() : '';
            
            // Extract description - try multiple selectors like in contentScript.js
            const descElement = card.querySelector('#description') || 
                              card.querySelector('yt-formatted-string#description-text') ||
                              card.querySelector('#description-text') ||
                              card.querySelector('.ytd-video-secondary-info-renderer #description');
            const description = descElement ? descElement.textContent.trim() : '';
            
            // Extract channel name
            const channelElement = card.querySelector('#channel-name a') || card.querySelector('#channel-name yt-formatted-string a');
            const channel = channelElement ? channelElement.textContent.trim() : '';
            
            // Extract view count and time
            const metaElement = card.querySelector('#metadata-line');
            let views = '';
            let timeAgo = '';
            
            if (metaElement) {
                const viewElement = metaElement.querySelector('.inline-metadata-item');
                const timeElement = metaElement.querySelectorAll('.inline-metadata-item')[1];
                
                views = viewElement ? viewElement.textContent.trim() : '';
                timeAgo = timeElement ? timeElement.textContent.trim() : '';
            }
            
            // Use actual description if available, otherwise fall back to metadata
            const finalDescription = description || `${channel} • ${views} • ${timeAgo}`.trim();
            
            if (title) {
                return {
                    id: this.generateVideoId(),
                    title: title,
                    description: finalDescription || 'No description available',
                    channel: channel,
                    views: views,
                    timeAgo: timeAgo
                };
            }
        } catch (error) {
            console.error('Error extracting video data:', error);
        }
        
        return null;
    }

    setupClassificationDropZones() {
        // Setup drop zones for each category
        const bins = document.querySelectorAll('.category-bin');
        bins.forEach(bin => {
            bin.addEventListener('dragover', (e) => {
                e.preventDefault();
                bin.classList.add('drag-over');
            });
            
            bin.addEventListener('dragleave', () => {
                bin.classList.remove('drag-over');
            });
            
            bin.addEventListener('drop', (e) => {
                e.preventDefault();
                bin.classList.remove('drag-over');
                
                try {
                    const videoData = JSON.parse(e.dataTransfer.getData('application/json'));
                    const category = bin.dataset.category;
                    this.classifyVideoFromCard(videoData, category);
                } catch (error) {
                    console.error('Error processing dropped video:', error);
                }
            });
        });
    }

    classifyVideoFromCard(videoData, category) {
        if (!videoData || !videoData.title) return;
        
        const classifiedVideo = {
            title: videoData.title,
            description: videoData.description,
            label: category
        };
        
        // Add to classified videos
        this.classifiedVideos.push(classifiedVideo);
        
        // Add to the category bin
        const bin = document.querySelector(`[data-category="${category}"]`);
        const binContent = bin.querySelector('.bin-content');
        
        const videoElement = document.createElement('div');
        videoElement.className = 'classified-video';
        videoElement.innerHTML = `
            <strong>${videoData.title}</strong>
            <small>${videoData.description.substring(0, 100)}...</small>
        `;
        
        binContent.appendChild(videoElement);
        
        // Save to storage
        this.saveToStorage();
        
        // Show success message
        this.showNotification(`Video classified as "${category}"`);
    }

    getCurrentVideoData() {
        // Try different selectors for video title
        const titleSelectors = [
            '#title h1',
            '#video-title',
            'h1.ytd-video-primary-info-renderer',
            '.ytd-video-primary-info-renderer h1'
        ];
        
        let title = '';
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                title = element.textContent.trim();
                break;
            }
        }
        
        // Try different selectors for description - same as contentScript.js
        const descSelectors = [
            '#description #description-text',
            '#description-text',
            '.ytd-video-secondary-info-renderer #description',
            '#description',
            'yt-formatted-string#description-text'
        ];
        
        let description = '';
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                description = element.textContent.trim();
                break;
            }
        }
        
        if (title) {
            return {
                id: this.generateVideoId(),
                title: title,
                description: description || 'No description available'
            };
        }
        
        return null;
    }

    generateVideoId() {
        return 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    setupDragAndDrop(videoCard) {
        videoCard.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', videoCard.dataset.videoId);
            videoCard.classList.add('dragging');
        });
        
        videoCard.addEventListener('dragend', () => {
            videoCard.classList.remove('dragging');
        });
        
        // Setup drop zones for each category
        const bins = document.querySelectorAll('.category-bin');
        bins.forEach(bin => {
            bin.addEventListener('dragover', (e) => {
                e.preventDefault();
                bin.classList.add('drag-over');
            });
            
            bin.addEventListener('dragleave', () => {
                bin.classList.remove('drag-over');
            });
            
            bin.addEventListener('drop', (e) => {
                e.preventDefault();
                bin.classList.remove('drag-over');
                
                const videoId = e.dataTransfer.getData('text/plain');
                const category = bin.dataset.category;
                this.classifyVideo(videoId, category);
            });
        });
    }

    classifyVideo(videoId, category) {
        const videoData = this.getCurrentVideoData();
        if (!videoData) return;
        
        const classifiedVideo = {
            title: videoData.title,
            description: videoData.description,
            label: category
        };
        
        // Add to classified videos
        this.classifiedVideos.push(classifiedVideo);
        
        // Add to the category bin
        const bin = document.querySelector(`[data-category="${category}"]`);
        const binContent = bin.querySelector('.bin-content');
        
        const videoElement = document.createElement('div');
        videoElement.className = 'classified-video';
        videoElement.innerHTML = `
            <strong>${videoData.title}</strong>
            <small>${videoData.description.substring(0, 100)}...</small>
        `;
        
        binContent.appendChild(videoElement);
        
        // Save to storage
        this.saveToStorage();
        
        // Show success message
        this.showNotification(`Video classified as "${category}"`);
        
        // Clear the video info
        document.getElementById('video-info').innerHTML = '';
    }

    saveToStorage() {
        chrome.storage.local.set({
            'classifiedVideos': this.classifiedVideos
        }, () => {
            console.log('Videos saved to storage');
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'classifier-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showExportPopup() {
        // Remove existing popup if any
        const existingPopup = document.getElementById('export-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const popup = document.createElement('div');
        popup.id = 'export-popup';
        popup.className = 'export-popup';
        
        const popupContent = document.createElement('div');
        popupContent.className = 'export-popup-content';
        
        const header = document.createElement('div');
        header.className = 'export-popup-header';
        header.innerHTML = '<h3>Export Classifications</h3><button id="close-export-btn">×</button>';
        
        const stats = document.createElement('div');
        stats.className = 'export-stats';
        const totalVideos = this.classifiedVideos.length;
        stats.innerHTML = `
            <p>Total videos classified: <strong>${totalVideos}</strong></p>
            <div class="category-stats">
                ${this.categories.map(category => {
                    const count = this.classifiedVideos.filter(video => video.label === category).length;
                    return `<span class="category-stat">${category}: ${count}</span>`;
                }).join('')}
            </div>
        `;
        
        const exportOptions = document.createElement('div');
        exportOptions.className = 'export-options';
        exportOptions.innerHTML = `
            <div class="export-option">
                <label>
                    <input type="radio" name="export-format" value="json" checked>
                    Export as JSON (like data.json)
                </label>
            </div>
            <div class="export-option">
                <label>
                    <input type="radio" name="export-format" value="csv">
                    Export as CSV
                </label>
            </div>
        `;
        
        const buttons = document.createElement('div');
        buttons.className = 'export-buttons';
        buttons.innerHTML = `
            <button id="copy-btn" class="export-btn">Copy to Clipboard</button>
            <button id="download-btn" class="export-btn">Download File</button>
        `;
        
        popupContent.appendChild(header);
        popupContent.appendChild(stats);
        popupContent.appendChild(exportOptions);
        popupContent.appendChild(buttons);
        popup.appendChild(popupContent);
        
        document.body.appendChild(popup);
        
        // Event listeners
        document.getElementById('close-export-btn').addEventListener('click', () => {
            popup.remove();
        });
        
        document.getElementById('copy-btn').addEventListener('click', () => {
            this.copyToClipboard();
        });
        
        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadFile();
        });
        
        // Close popup when clicking outside
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });
    }

    copyToClipboard() {
        const format = document.querySelector('input[name="export-format"]:checked').value;
        const data = this.formatExportData(format);
        
        navigator.clipboard.writeText(data).then(() => {
            this.showNotification('Data copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showNotification('Failed to copy to clipboard');
        });
    }

    downloadFile() {
        const format = document.querySelector('input[name="export-format"]:checked').value;
        const data = this.formatExportData(format);
        const filename = `youtube_classifications.${format === 'json' ? 'json' : 'csv'}`;
        
        const blob = new Blob([data], { 
            type: format === 'json' ? 'application/json' : 'text/csv' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('File downloaded!');
    }

    formatExportData(format) {
        if (format === 'json') {
            // Format exactly like data.json
            return JSON.stringify(this.classifiedVideos, null, 4);
        } else {
            // CSV format
            const headers = ['title', 'description', 'label'];
            const csvContent = [
                headers.join(','),
                ...this.classifiedVideos.map(video => 
                    headers.map(header => 
                        `"${video[header].replace(/"/g, '""')}"`
                    ).join(',')
                )
            ].join('\n');
            return csvContent;
        }
    }

    setupEventListeners() {
        // Listen for navigation changes
        let currentUrl = window.location.href;
        const observer = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                setTimeout(() => {
                    this.updateVideoInfo();
                    this.makeAllVideosDraggable();
                }, 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Also listen for new video cards being added (for infinite scroll)
        const videoObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new video cards were added
                            if (node.querySelector && node.querySelector('ytd-rich-item-renderer')) {
                                setTimeout(() => {
                                    this.makeAllVideosDraggable();
                                }, 500);
                            }
                        }
                    });
                }
            });
        });
        
        videoObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize the classifier when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new YouTubeClassifier();
    });
} else {
    new YouTubeClassifier();
} 