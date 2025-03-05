async function downloadMedia() {
    const urlInput = document.getElementById('urlInput');
    const result = document.getElementById('result');
    const mediaPreview = document.getElementById('mediaPreview');
    const savedColor = localStorage.getItem('accentColor') || 'indigo';
    const downloadBtn = document.querySelector('.download-btn');
    const originalBtnContent = downloadBtn.innerHTML;

    if (!urlInput.value.trim()) {
        mediaPreview.innerHTML = `
            <div class="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-800/50 rounded-xl p-4">
                <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-200 dark:bg-red-800/50">
                        <i class="fas fa-exclamation-circle text-red-600 dark:text-red-400"></i>
                    </div>
                    <p class="text-red-800 dark:text-red-300 font-medium">URL cannot be empty</p>
                </div>
            </div>
        `;
        result.classList.remove('hidden');
        return;
    }

    try {
        result.classList.add('hidden');
        mediaPreview.innerHTML = '';
        
        
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
            </div>
        `;

        const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlInput.value })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        window.lastMediaData = data;
        mediaPreview.innerHTML = generateMediaPreviewHTML(data, savedColor);
        result.classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalBtnContent;
    }
}

function showMediaPreview(data) {
    const videoUrl = data.downloads.find(d => d.type.includes('video'))?.url;
    if (!videoUrl) return;

    const savedColor = localStorage.getItem('accentColor') || 'indigo';
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[999999] flex items-start justify-center overflow-y-auto';
    modal.style.cssText = 'margin-top: max(env(safe-area-inset-top), 1rem);';

    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/95 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl mx-4 my-4">
            
            <div class="relative bg-black">
                <div class="aspect-square">
                    <video id="mediaPlayer" 
                           class="w-full h-full object-contain"
                           controls
                           autoplay
                           playsinline>
                        <source src="${videoUrl}" type="video/mp4">
                    </video>
                </div>

                
                <button onclick="closeMediaPreview(this)" 
                        class="absolute top-3 right-3 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all z-50">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            
            <div class="p-4 space-y-4 bg-white dark:bg-gray-900">
                
                ${data.caption ? `
                    <div class="bg-white/5 dark:bg-gray-800/20 p-3 rounded-xl border border-gray-300/20 dark:border-gray-600/20">
                        <p class="text-sm text-${savedColor}-700 dark:text-${savedColor}-300 font-medium leading-relaxed">
                            ${data.caption}
                        </p>
                    </div>
                ` : ''}
                
                
                ${data.author ? `
                    <div class="flex items-center gap-3 bg-white/5 dark:bg-gray-800/20 p-3 rounded-xl border border-gray-300/20 dark:border-gray-600/20">
                        <div class="w-10 h-10 rounded-full bg-${savedColor}-500/10 flex items-center justify-center">
                            <i class="fas fa-user text-lg text-${savedColor}-600 dark:text-${savedColor}-400"></i>
                        </div>
                        <div>
                            <div class="text-${savedColor}-700 dark:text-${savedColor}-300 text-sm font-bold">${data.author}</div>
                            ${data.username ? `<div class="text-${savedColor}-600 dark:text-${savedColor}-400 text-xs font-medium">@${data.username}</div>` : ''}
                        </div>
                    </div>
                ` : ''}

                
                <div class="grid grid-cols-3 gap-2">
                    ${['views', 'like', 'comments'].map(stat => 
                        data[stat] ? `
                            <div class="flex items-center gap-2.5 bg-white/5 dark:bg-gray-800/20 p-3 rounded-xl border border-gray-300/20 dark:border-gray-600/20">
                                <div class="w-8 h-8 rounded-full bg-${savedColor}-500/10 flex items-center justify-center">
                                    <i class="fas fa-${getIconForStat(stat)} text-${savedColor}-600 dark:text-${savedColor}-400"></i>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-${savedColor}-700 dark:text-${savedColor}-300 text-sm font-medium">${formatNumber(data[stat])}</span>
                                    <span class="text-${savedColor}-600 dark:text-${savedColor}-400 text-xs capitalize">${stat}</span>
                                </div>
                            </div>
                        ` : ''
                    ).filter(Boolean).join('')}
                </div>

                
                <div class="grid gap-2 ${data.downloads.length === 1 ? 'grid-cols-1' : data.downloads.length === 2 ? 'grid-cols-2' : '[&>*:first-child]:col-span-2 grid-cols-2'}">
                    ${data.downloads
                        .sort((a, b) => {
                            const qualityOrder = {
                                '2160p': 1, '1440p': 2, '1080p': 3, '720p': 4,
                                '480p': 5, '360p': 6, '240p': 7
                            };
                            return (qualityOrder[a.quality] || 99) - (qualityOrder[b.quality] || 99);
                        })
                        .map(download => `
                            <a href="${download.url}" 
                               target="_blank"
                               class="group p-3 bg-white/5 dark:bg-gray-800/20 hover:bg-${savedColor}-500/10 dark:hover:bg-${savedColor}-500/20 rounded-xl border border-gray-300/20 dark:border-gray-600/20 transition-all">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-${savedColor}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i class="fas ${getIconForType(download.type)} text-${savedColor}-600 dark:text-${savedColor}-400"></i>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-${savedColor}-700 dark:text-${savedColor}-300 text-sm font-bold">${getDisplayName(download.type)}</span>
                                        <span class="text-${savedColor}-600 dark:text-${savedColor}-400 text-xs font-medium">Klik untuk buka</span>
                                    </div>
                                </div>
                            </a>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const videoPlayer = modal.querySelector('video');

    
    videoPlayer.addEventListener('click', (e) => {
        e.stopPropagation();
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    });

    
    videoPlayer.addEventListener('loadedmetadata', () => {
        videoPlayer.play().catch(error => {
            console.log('Auto-play prevented:', error);
            const playButton = document.createElement('button');
            playButton.className = 'absolute inset-0 w-full h-full flex items-center justify-center bg-black/50';
            playButton.innerHTML = `
                <div class="w-16 h-16 flex items-center justify-center rounded-full bg-${savedColor}-500/80 hover:bg-${savedColor}-500">
                    <i class="fas fa-play text-2xl text-white"></i>
                </div>
            `;
            playButton.onclick = (e) => {
                e.stopPropagation();
                videoPlayer.play();
                playButton.remove();
            };
            videoPlayer.parentElement.appendChild(playButton);
        });
    });

    
    videoPlayer.addEventListener('error', () => {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'absolute inset-0 flex items-center justify-center bg-black';
        errorMessage.innerHTML = `
            <div class="text-center text-white">
                <i class="fas fa-exclamation-circle text-4xl mb-2"></i>
                <p>Video tidak dapat diputar</p>
                <p class="text-sm text-gray-400 mt-2">Coba refresh halaman atau gunakan browser lain</p>
            </div>
        `;
        videoPlayer.parentElement.appendChild(errorMessage);
    });

    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMediaPreview(modal.querySelector('button'));
        }
    });

    
    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            closeMediaPreview(modal.querySelector('button'));
        } else if (e.key === ' ') {
            e.preventDefault();
            if (videoPlayer.paused) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
        }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    modal.handleKeyPress = handleKeyPress;
}

function toggleDownloadOptions(button) {
    const downloadPanel = button.closest('.relative').querySelector('#downloadOptions');
    downloadPanel.classList.toggle('hidden');
}

function closeMediaPreview(element) {
    const modal = element.closest('.fixed');
    if (!modal) return;

    const video = modal.querySelector('video');
    if (video) {
        video.pause();
        video.src = '';
        video.load();
    }

    
    if (modal.handleKeyPress) {
        document.removeEventListener('keydown', modal.handleKeyPress);
    }

    modal.remove();
}

async function showDownloadOptions(data) {
    try {
        const savedColor = localStorage.getItem('accentColor') || 'indigo';
        const downloadData = typeof data === 'string' ? JSON.parse(data) : data;
        
        const modal = document.createElement('div');
        modal.setAttribute('x-data', '');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            <div :class="\`relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 transform transition-all duration-300 space-y-4\`">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-base sm:text-lg font-semibold text-${savedColor}-600 dark:text-${savedColor}-400">
                        ${downloadData.metadata?.title || 'Download Options'}
                    </h3>
                    <button onclick="closeModal(this.closest('.fixed'))" 
                            class="w-8 h-8 flex items-center justify-center text-${savedColor}-500 hover:text-${savedColor}-600 dark:text-${savedColor}-400 dark:hover:text-${savedColor}-300">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-2">
                    ${downloadData.downloads.map(download => `
                        <button onclick="downloadFile('${download.url}', '${download.filename || `download.${getFileExtension(download.type)}`}')" 
                           class="block w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-${savedColor}-50 dark:hover:bg-${savedColor}-900/20 rounded-lg transition-all duration-300">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-${savedColor}-100 dark:bg-${savedColor}-900/30">
                                    <i class="fas ${getIconForType(download.type)} text-${savedColor}-500 dark:text-${savedColor}-400"></i>
                                </div>
                                <div class="flex flex-col items-start">
                                    <span class="text-sm font-bold text-${savedColor}-600 dark:text-${savedColor}-400 text-left">
                                        ${getDisplayName(download.type)}
                                    </span>
                                    <span class="text-xs text-${savedColor}-500 dark:text-${savedColor}-500">
                                        Click to download
                                    </span>
                                </div>
                            </div>
                            <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-${savedColor}-100 dark:bg-${savedColor}-900/30">
                                <i class="fas fa-download text-${savedColor}-500 dark:text-${savedColor}-400"></i>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        Alpine.initTree(modal);

        const backdrop = modal.querySelector('.absolute');
        const content = modal.querySelector('.relative');

        requestAnimationFrame(() => {
            backdrop.classList.add('opacity-100');
            content.classList.add('scale-100', 'opacity-100');
        });

        const closeHandler = (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        };

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(modal);
            }
        };

        modal.addEventListener('click', closeHandler);
        document.addEventListener('keydown', escHandler);

        modal.closeHandler = closeHandler;
        modal.escHandler = escHandler;

    } catch (error) {
        console.error('Error showing download options:', error);
        showError('Gagal menampilkan opsi download');
    }
}

function closeModal(modal) {
    if (!modal) return;
    
    const backdrop = modal.querySelector('.absolute');
    const content = modal.querySelector('.relative');
    
        backdrop.classList.remove('opacity-100');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    
        if (modal.closeHandler) {
        modal.removeEventListener('click', modal.closeHandler);
    }
    if (modal.escHandler) {
        document.removeEventListener('keydown', modal.escHandler);
    }
    
        setTimeout(() => {
        modal.remove();
    }, 300);
}

function getIconForType(type) {
    const icons = {
        download_video_hd: 'fa-film',
        download_video_2160p: 'fa-film',
        download_video_1440p: 'fa-film',
        download_video_1080p: 'fa-film',
        download_video_720p: 'fa-film',
        download_video_480p: 'fa-video',
        download_video_360p: 'fa-video',
        download_video_240p: 'fa-video',
        download_audio: 'fa-music',
        download_image: 'fa-image'
    };
    return icons[type] || 'fa-download';
}

function getDisplayName(type) {
    const names = {
        download_video_hd: 'HD Quality',
        download_video_2160p: '4K Ultra HD',
        download_video_1440p: '2K Quality',
        download_video_1080p: 'Full HD',
        download_video_720p: 'HD 720p',
        download_video_480p: 'SD 480p',
        download_video_360p: 'Low 360p',
        download_video_240p: 'Low 240p',
        download_audio: 'Audio MP3',
        download_image: 'Image HD'
    };
    return names[type] || type;
}

function getIconForStat(stat) {
    const icons = {
        'views': 'eye',
        'like': 'heart',
        'comments': 'comment'
    };
    return icons[stat] || 'chart-bar';
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function showError(message) {
    const mediaPreview = document.getElementById('mediaPreview');
    mediaPreview.innerHTML = `
        <div class="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-800/50 rounded-xl p-4">
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-200 dark:bg-red-800/50">
                    <i class="fas fa-exclamation-circle text-red-600 dark:text-red-400"></i>
                </div>
                <p class="text-red-800 dark:text-red-300 font-medium">${message}</p>
            </div>
        </div>
    `;
}

function initColorManager() {
        const availableColors = [
        { name: 'red', label: 'Merah' },
        { name: 'blue', label: 'Biru' },
        { name: 'green', label: 'Hijau' },
        { name: 'yellow', label: 'Kuning' },
        { name: 'purple', label: 'Ungu' },
        { name: 'indigo', label: 'Indigo' },
        { name: 'pink', label: 'Pink' },
    ];

        const currentColor = localStorage.getItem('accentColor') || 'indigo';
    
        document.documentElement.setAttribute('data-accent', currentColor);

        const menuDropdown = document.querySelector('.dropdown-menu');
    if (menuDropdown) {
        menuDropdown.style.zIndex = '99999';
    }
    
    const colorSection = document.createElement('div');
    colorSection.className = 'px-4 py-3 border-t border-gray-100 dark:border-gray-700/30';
    
    colorSection.innerHTML = `
        <div class="mb-2">
            <span class="text-sm font-medium text-gray-800 dark:text-white">Accent Color</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
            ${availableColors.map(color => `
                <button data-color="${color.name}" 
                        class="w-8 h-8 rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-${color.name}-500"
                        style="background-color: var(--${color.name}-500);"
                        title="${color.label}">
                </button>
            `).join('')}
        </div>
    `;

        colorSection.querySelectorAll('button[data-color]').forEach(button => {
        button.addEventListener('click', () => {
            const newColor = button.dataset.color;
            setAccentColor(newColor);
            
                        updateDynamicElements(newColor);
            window.dispatchEvent(new CustomEvent('accent-color-changed', { 
            detail: { oldColor, newColor } 
}));
        });
    });

        const darkModeSection = document.querySelector('.dark-mode-section');
    darkModeSection.parentNode.insertBefore(colorSection, darkModeSection.nextSibling);
}

document.addEventListener('DOMContentLoaded', initColorManager);

function setAccentColor(newColor, oldColor = 'indigo') {
    
    localStorage.setItem('accentColor', newColor);

    
    if (window.Alpine) {
        Alpine.store('accent', {
            color: newColor
        });
    }

    
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
        
        if (element.classList && element.classList.length > 0) {
            const classList = Array.from(element.classList);
            
            const prefixes = [
                'bg', 'text', 'border', 'ring', 'from', 'to', 'via',
                'hover:bg', 'hover:text', 'hover:border', 'hover:ring',
                'focus:bg', 'focus:text', 'focus:border', 'focus:ring',
                'active:bg', 'active:text', 'active:border',
                'dark:bg', 'dark:text', 'dark:border', 'dark:ring',
                'dark:hover:bg', 'dark:hover:text', 'dark:hover:border',
                'dark:focus:bg', 'dark:focus:text', 'dark:focus:border',
                'shadow', 'group-hover'
            ];

            const intensities = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

            prefixes.forEach(prefix => {
                intensities.forEach(intensity => {
                    const oldClass = `${prefix}-${oldColor}-${intensity}`;
                    const newClass = `${prefix}-${newColor}-${intensity}`;
                    
                    if (classList.includes(oldClass)) {
                        element.classList.remove(oldClass);
                        element.classList.add(newClass);
                    }
                });
            });
        }

        
        if (element.style) {
            const styleProps = ['backgroundColor', 'color', 'borderColor'];
            styleProps.forEach(prop => {
                if (element.style[prop]?.includes(oldColor)) {
                    element.style[prop] = element.style[prop].replace(oldColor, newColor);
                }
            });
        }
    });

    
    window.dispatchEvent(new CustomEvent('accent-color-changed', { 
        detail: { oldColor, newColor } 
    }));

    
    document.querySelectorAll('[x-data]').forEach(el => {
        if (el.__x) {
            el.__x.$data.currentColor = newColor;
        }
    });
}


document.addEventListener('alpine:init', () => {
    Alpine.store('accent', {
        color: localStorage.getItem('accentColor') || 'indigo',
        
        setColor(newColor) {
            const oldColor = this.color;
            this.color = newColor;
            setAccentColor(newColor, oldColor);
        }
    });
});

function updateDynamicElements(color) {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="relative w-12 h-12">
                    <div class="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-gray-700"></div>
                    <div class="absolute inset-0 rounded-full border-[3px] border-t-${color}-500 dark:border-t-${color}-400 animate-spin"></div>
                </div>
            </div>
        `;
    }

    if (window.lastMediaData) {
        const mediaPreview = document.getElementById('mediaPreview');
        if (mediaPreview) {
            mediaPreview.innerHTML = generateMediaPreviewHTML(window.lastMediaData, color);
        }
    }

    const gradients = document.querySelectorAll('[class*="gradient"]');
    gradients.forEach(gradient => {
        gradient.className = gradient.className
            .replace(/from-\w+-\d+/g, `from-${color}-50`)
            .replace(/to-\w+-\d+/g, `to-${color}-50`);
    });

    document.querySelectorAll('button, a').forEach(element => {
        if (element.className.includes('bg-') || element.className.includes('text-')) {
            updateElementColors(element, color);
        }
    });
}

function updateElementColors(element, newColor, oldColor = 'indigo') {
    const classList = Array.from(element.classList);
    
    classList.forEach(className => {
        if (className.includes(oldColor) || className.includes('indigo')) {
            const newClass = className
                .replace(oldColor, newColor)
                .replace('indigo', newColor);
            element.classList.remove(className);
            element.classList.add(newClass);
        }
    });
}

const observer = new MutationObserver((mutations) => {
    const currentColor = localStorage.getItem('accentColor') || 'indigo';
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {                                 if (node.classList.contains('dropdown-menu')) {
                    node.style.zIndex = '99999';
                } else if (node.classList.contains('modal')) {
                    node.style.zIndex = '99999';
                } else {
                    node.style.zIndex = '0';
                }
                
                updateElementColors(node, currentColor);
                node.querySelectorAll('*').forEach(child => {
                    updateElementColors(child, currentColor);
                });
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
});

document.addEventListener('DOMContentLoaded', () => {
    const savedColor = localStorage.getItem('accentColor') || 'indigo';
    if (savedColor !== 'indigo') {
        setAccentColor(savedColor, 'indigo');
    }
});

function generateMediaPreviewHTML(data, savedColor) {
    return `
        <div class="bg-gray-50 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div class="flex flex-col sm:flex-row gap-6">
                
                <div class="w-full sm:w-48 flex-shrink-0">
                    <div class="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700/50 shadow-sm relative group cursor-pointer"
                         onclick="showMediaPreview(${JSON.stringify(data).replace(/"/g, '&quot;')})">
                        ${data['img-thumb'] ? `
                            <img src="${data['img-thumb']}" 
                                 alt="Preview" 
                                 onerror="this.parentElement.innerHTML='<div class=\'w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600\'><i class=\'fas fa-video text-4xl text-gray-400 dark:text-gray-500\'></i></div>'"
                                 class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300">
                        ` : `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                                <i class="fas fa-video text-4xl text-gray-400 dark:text-gray-500"></i>
                            </div>
                        `}
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div class="w-12 h-12 rounded-full bg-${savedColor}-500/80 flex items-center justify-center">
                                <i class="fas fa-play text-white"></i>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div class="flex-1 flex flex-col justify-center gap-4">
                    
                    ${data.platform ? `
                        <div class="space-y-2">
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Detected Platform</div>
                            <div class="flex items-center gap-2">
                                ${getPlatformBadges(data.platform, savedColor)}
                            </div>
                        </div>
                    ` : ''}

                    
                    <button onclick="showMediaPreview(${JSON.stringify(data).replace(/"/g, '&quot;')})" 
                            class="w-full px-4 py-3 bg-${savedColor}-500 hover:bg-${savedColor}-600 text-white rounded-xl shadow-lg shadow-${savedColor}-500/20 hover:shadow-${savedColor}-500/30 transition-all duration-300 flex items-center justify-center gap-3 font-medium">
                        <i class="fas fa-download"></i>
                        <span>Download Media</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}


function getPlatformBadges(platform, savedColor) {
    const platforms = {
        'tiktok': { icon: 'fab fa-tiktok', label: 'TikTok' },
        'instagram': { icon: 'fab fa-instagram', label: 'Instagram' },
        'youtube': { icon: 'fab fa-youtube', label: 'YouTube' },
        'facebook': { icon: 'fab fa-facebook', label: 'Facebook' },
        'capcut': { icon: 'fas fa-video', label: 'CapCut' },
        'rednote': { icon: 'fas fa-book', label: 'RedNote' },
        'threads': { icon: 'fab fa-at', label: 'Threads' },
        'soundcloud': { icon: 'fab fa-soundcloud', label: 'Soundcloud' },
        'spotify': { icon: 'fab fa-spotify', label: 'Spotify' },
        'terabox': { icon: 'fas fa-box', label: 'Terabox' },
        'snackvideo': { icon: 'fas fa-video', label: 'Snackvideo' },
        'doodstream': { icon: 'fas fa-video', label: 'Doodstream' }
    };

    const platformInfo = platforms[platform?.toLowerCase()] || { icon: 'fas fa-link', label: platform || 'Unknown' };
    
    return `
        <div class="inline-flex items-center gap-2 px-3 py-2 bg-${savedColor}-500/5 dark:bg-${savedColor}-500/10 rounded-lg border border-${savedColor}-500/20 dark:border-${savedColor}-400/20">
            <i class="${platformInfo.icon} text-${savedColor}-500 dark:text-${savedColor}-400"></i>
            <span class="text-sm font-medium text-${savedColor}-700 dark:text-${savedColor}-300">${platformInfo.label}</span>
        </div>
    `;
}

window.addEventListener('accent-color-changed', (event) => {
    const { oldColor, newColor } = event.detail;
    updateAccentColor(document.body, oldColor, newColor);
});

function updateAccentColor(element, oldColor, newColor) {
        updateElementColors(element, newColor, oldColor);

        element.childNodes.forEach(child => {
        if (child.nodeType === 1) {             updateAccentColor(child, oldColor, newColor);
        }
    });
}

function downloadFile(url) {
    if (!url) return;
    window.open(url, '_blank');
}

function showToast(message, type = 'info') {
    const savedColor = localStorage.getItem('accentColor') || 'indigo';
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 px-4 sm:px-6 py-3 rounded-xl shadow-lg text-white transform transition-all duration-300 z-50 text-sm sm:text-base text-center sm:text-left ${
        type === 'error' ? 'bg-red-500' : `bg-${savedColor}-500`
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getFileExtension(type) {
    const extensions = {
        video_2160p: 'mp4',
        video_1440p: 'mp4',
        video_hd: 'mp4',
        video_watermark: 'mp4',
        audio: 'mp3',
        image: 'jpg',
        webp: 'webp' 
    };
    return extensions[type] || 'mp4';
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
                        history.pushState(null, '', targetId);
        }
    });
});

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelector(`a[href="#${sectionId}"]`)?.classList.add('active');
        } else {
            document.querySelector(`a[href="#${sectionId}"]`)?.classList.remove('active');
        }
    });
});


const style = document.createElement('style');
style.textContent = `
    @keyframes custom-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .animate-spin {
        animation: custom-spin 0.8s linear infinite;
    }
`;
document.head.appendChild(style);
document.head.appendChild(style);


function updateLoadingSpinner() {
    const savedColor = localStorage.getItem('accentColor') || 'indigo';
    const loading = document.getElementById('loading');
    if (loading) {
        loading.innerHTML = `
            <div class="flex items-center justify-center p-4">
                <div class="relative w-10 h-10">
                    <div class="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
                    <div class="absolute inset-0 rounded-full border-2 border-t-${savedColor}-500 dark:border-t-${savedColor}-400 animate-spin"></div>
                </div>
            </div>
        `;
    }
}


window.addEventListener('accent-color-changed', updateLoadingSpinner);