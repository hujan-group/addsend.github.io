let currentVideoData = null;

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

themeToggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});

// Tab System
const tabTriggers = document.querySelectorAll('.tab-trigger');
const tabContents = document.querySelectorAll('.tab-content');

tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const tabId = trigger.dataset.tab;

        // Update active states
        tabTriggers.forEach(t => t.classList.remove('active'));
        trigger.classList.add('active');

        // Show/hide content
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId + '-tab').classList.add('active');

        // Load history when switching to history tab
        if (tabId === 'history') {
            loadHistory();
        }
    });
});

// FAQ Accordion
const faqTriggers = document.querySelectorAll('.faq-trigger');
faqTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const content = trigger.nextElementSibling;
        const icon = trigger.querySelector('.fa-chevron-down');

        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    });
});

// Paste Button
document.getElementById('paste-btn').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('tiktok-url').value = text;
        showToast('URL pasted successfully!');
    } catch (err) {
        showToast('Failed to paste from clipboard', 'error');
    }
});

// New Video Button
document.getElementById('new-video-btn').addEventListener('click', () => {
    // Reset form
    document.getElementById('tiktok-url').value = '';
    document.getElementById('video-preview').classList.add('hidden');
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('download-progress').classList.add('hidden');
    document.getElementById('new-video-btn').classList.add('hidden');
    currentVideoData = null;

    // Focus on input
    document.getElementById('tiktok-url').focus();
    showToast('Ready for new video URL!');
});

// URL Validation
function validateTikTokUrl(url) {
    const tikTokRegex = /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/.+/i;
    return tikTokRegex.test(url);
}

// Toast System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// History Management
function saveToHistory(url, data) {
    try {
        const history = getHistory();
        const newItem = {
            url: url,
            data: data,
            timestamp: Date.now()
        };

        const newHistory = [newItem, ...history.filter(h => h.url !== url)].slice(0, 5);
        localStorage.setItem('tiktok-toolkit-history', JSON.stringify(newHistory));
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

function getHistory() {
    try {
        const history = localStorage.getItem('tiktok-toolkit-history');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error loading history:', error);
        return [];
    }
}

function clearHistory() {
    localStorage.removeItem('tiktok-toolkit-history');
    loadHistory();
    showToast('History cleared successfully');
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function loadHistory() {
    const history = getHistory();
    const container = document.getElementById('history-content');

    if (history.length === 0) {
        container.innerHTML = `
                    <div class="card" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-history" style="font-size: 3rem; color: var(--muted-foreground); margin-bottom: 1rem;"></i>
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No History Yet</h3>
                        <p style="color: var(--muted-foreground);">
                            URLs you check will appear here for quick access.<br>
                            Your history is stored locally and never shared.
                        </p>
                    </div>
                `;
        return;
    }

    container.innerHTML = history.map((item, index) => `
                <div class="history-item">
                    <div class="history-thumbnail">
                        <img src="${item.data.thumbnail}" alt="Video thumbnail">
                    </div>
                    <div class="history-details" style="flex: 1;">
                        <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 0.5rem;">
                            <div style="flex: 1;">
                                <h3 style="font-weight: 600; margin-bottom: 0.25rem; line-height: 1.3;" class="line-clamp-2">${item.data.title}</h3>
                                <p style="color: #3b82f6; font-size: 0.875rem;">${item.data.author}</p>
                            </div>
                            <span style="background: var(--secondary); color: var(--secondary-foreground); font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">#${index + 1}</span>
                        </div>
                        <p style="color: var(--muted-foreground); font-size: 0.875rem; margin-bottom: 0.75rem;" class="line-clamp-2">${item.data.description}</p>
                        <div style="display: flex; justify-content: between; align-items: center;">
                            <div style="display: flex; align-items: center; font-size: 0.875rem; color: var(--muted-foreground);">
                                <i class="fas fa-calendar" style="margin-right: 0.25rem;"></i>
                                ${formatDate(item.timestamp)}
                            </div>
                            <button class="btn btn-outline" style="font-size: 0.875rem; padding: 0.5rem 1rem;" onclick="window.open('${item.url}', '_blank')">
                                <i class="fas fa-external-link-alt"></i>
                                Open URL
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
}

// Clear History Event
document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

// URL Check Functionality
document.getElementById('check-url-btn').addEventListener('click', async () => {
    const url = document.getElementById('tiktok-url').value.trim();

    if (!url) {
        showToast('Please enter a TikTok URL', 'error');
        return;
    }

    if (!validateTikTokUrl(url)) {
        showToast('Please enter a valid TikTok URL', 'error');
        return;
    }

    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const videoPreview = document.getElementById('video-preview');
    const newVideoBtn = document.getElementById('new-video-btn');

    // Show loading state
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    videoPreview.classList.add('hidden');
    newVideoBtn.classList.add('hidden');

    try {
        const response = await fetch('https://www.tikwm.com/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `url=${encodeURIComponent(url)}&hd=1`
        });

        const data = await response.json();

        if (!response.ok || data.code !== 0) {
            throw new Error(data.msg || 'Failed to fetch video data');
        }

        currentVideoData = {
            title: data.data.title,
            author: data.data.author.nickname,
            description: data.data.title,
            thumbnail: data.data.cover,
            video_url: data.data.play,
            music_url: data.data.music,
            likes: data.data.digg_count,
            shares: data.data.share_count,
            comments: data.data.comment_count,
            views: data.data.play_count
        };

        // Update UI
        document.getElementById('video-thumbnail').src = currentVideoData.thumbnail;
        document.getElementById('video-title').textContent = currentVideoData.title;
        document.getElementById('video-author').textContent = '@' + currentVideoData.author;
        document.getElementById('video-description').textContent = currentVideoData.description;
        document.getElementById('video-likes').textContent = formatNumber(currentVideoData.likes);
        document.getElementById('video-shares').textContent = formatNumber(currentVideoData.shares);
        document.getElementById('video-comments').textContent = formatNumber(currentVideoData.comments);
        document.getElementById('video-views').textContent = formatNumber(currentVideoData.views);

        // Save to history
        saveToHistory(url, currentVideoData);

        // Show video preview and new video button
        loadingState.classList.add('hidden');
        videoPreview.classList.remove('hidden');
        newVideoBtn.classList.remove('hidden');

        showToast('Video loaded successfully!');

    } catch (error) {
        console.error('Error:', error);
        loadingState.classList.add('hidden');
        document.getElementById('error-message').textContent = error.message;
        errorState.classList.remove('hidden');
        showToast('Failed to load video: ' + error.message, 'error');
    }
});

// Format Numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Download Functionality
document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!currentVideoData) {
            showToast('Please check a TikTok URL first', 'error');
            return;
        }

        const format = btn.dataset.format;
        await performDownload(format);
    });
});

async function performDownload(format) {
    const progressContainer = document.getElementById('download-progress');
    const statusElement = document.getElementById('download-status');
    const percentElement = document.getElementById('download-percent');
    const fillElement = document.getElementById('progress-fill');

    // Show progress
    progressContainer.classList.remove('hidden');
    statusElement.textContent = `Downloading ${format.toUpperCase()}...`;
    percentElement.textContent = '0%';
    fillElement.style.transform = 'translateX(-100%)';

    try {
        let url, filename;

        if (format === 'mp4') {
            url = currentVideoData.video_url;
            filename = `${currentVideoData.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.mp4`;
        } else {
            url = currentVideoData.music_url;
            filename = `${currentVideoData.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.${format}`;
        }

        if (!url) {
            throw new Error(`${format.toUpperCase()} download URL not available`);
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentLength = response.headers.get('Content-Length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            loaded += value.length;

            let percent;
            if (total > 0) {
                percent = Math.min((loaded / total) * 100, 100);
            } else {
                percent = Math.min((loaded / 1000000) * 50, 90);
            }

            percentElement.textContent = Math.round(percent) + '%';
            fillElement.style.transform = `translateX(-${100 - percent}%)`;
        }

        const blob = new Blob(chunks);
        const downloadUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        percentElement.textContent = '100%';
        fillElement.style.transform = 'translateX(0%)';
        statusElement.textContent = 'Download Complete!';

        showToast(`✨ ${format.toUpperCase()} Downloaded Successfully!`);

        setTimeout(() => {
            progressContainer.classList.add('hidden');
        }, 2000);

    } catch (error) {
        console.error('Download error:', error);
        progressContainer.classList.add('hidden');
        showToast(`❌ Download Failed: ${error.message}`, 'error');
    }
}

// Enter key support for URL input
document.getElementById('tiktok-url').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('check-url-btn').click();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});
