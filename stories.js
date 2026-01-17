
// js/stories.js - TODO CON FIREBASE

document.addEventListener('DOMContentLoaded', () => {
    // Firebase Config
    const firebaseConfig = {
        apiKey: "AIzaSyBWBr3sud1_lDPmtLJI42pCBZnco5_vyCc",
        authDomain: "noble-amp-458106-g0.firebaseapp.com",
        databaseURL: "https://noble-amp-458106-g0-default-rtdb.firebaseio.com",
        projectId: "noble-amp-458106-g0",
        storageBucket: "noble-amp-458106-g0.firebasestorage.app",
        messagingSenderId: "744574411059",
        appId: "1:744574411059:web:72a70955f1400df6645e46",
        measurementId: "G-XEQ1J354HM"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const database = firebase.database();
    const storage = firebase.storage();

    const storiesContainer = document.getElementById('stories');
    const storyViewer = document.getElementById('story-viewer');
    const storyUploadModal = document.getElementById('story-upload-modal');

    // Event Listeners
    document.getElementById('add-story-btn').addEventListener('click', () => {
        storyUploadModal.classList.add('active');
    });

    document.getElementById('story-upload-back').addEventListener('click', () => {
        storyUploadModal.classList.remove('active');
        resetUploadForm();
    });

    document.getElementById('story-file').addEventListener('change', handleFileSelect);
    document.getElementById('story-upload-form').addEventListener('submit', handleStoryUpload);
    document.getElementById('story-viewer-close').addEventListener('click', closeStoryViewer);

    setTimeout(() => loadStories(), 500);
    setInterval(() => loadStories(), 30000);

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.querySelector('.story-upload-preview');
                const previewImg = preview.querySelector('img');
                previewImg.src = event.target.result;
                preview.style.display = 'block';
                document.querySelector('.file-input-label').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    function resetUploadForm() {
        document.getElementById('story-upload-form').reset();
        document.querySelector('.story-upload-preview').style.display = 'none';
        document.querySelector('.file-input-label').style.display = 'flex';
        const progressDiv = document.querySelector('.upload-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
            progressDiv.querySelector('.progress-bar').style.width = '0%';
        }
    }

    async function loadStories() {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setTimeout(loadStories, 1000);
            return;
        }

        try {
            const snapshot = await database.ref('stories').once('value');
            const stories = [];
            
            snapshot.forEach(child => {
                stories.push({ id: child.key, ...child.val() });
            });

            storiesContainer.innerHTML = '';

            if (stories.length > 0) {
                const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
                const recentStories = stories.filter(story => story.timestamp > twelveHoursAgo);

                // Eliminar historias viejas
                const oldStories = stories.filter(story => story.timestamp <= twelveHoursAgo);
                oldStories.forEach(story => {
                    database.ref('stories/' + story.id).remove();
                    if (story.coverImage) {
                        const imageRef = storage.refFromURL(story.coverImage);
                        imageRef.delete().catch(err => console.log('Error deleting old image:', err));
                    }
                });

                // Agrupar por usuario
                const storiesByUser = {};
                recentStories.forEach(story => {
                    if (!storiesByUser[story.userId]) {
                        storiesByUser[story.userId] = [];
                    }
                    storiesByUser[story.userId].push(story);
                });

                for (const userId in storiesByUser) {
                    const userStories = storiesByUser[userId];
                    if (userStories.length > 0) {
                        const latestStory = userStories[0];
                        const storyElement = createStoryElement(latestStory, userId);
                        if (storyElement) {
                            storiesContainer.appendChild(storyElement);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading stories:', error);
        }
    }

    function createStoryElement(storyData, userId) {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'flex flex-col items-center flex-shrink-0 cursor-pointer';
        
        // Usar username, nunca email, y saltar si es anónimo
        let displayName = storyData.username || storyData.email?.split('@')[0] || '';
        
        // No mostrar historias anónimas
        if (!displayName || displayName.toLowerCase() === 'anónimo' || displayName.toLowerCase() === 'anonimo') {
            return null;
        }
        
        storyDiv.innerHTML = `
            <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-0.5">
                <div class="w-full h-full rounded-full border-2 border-white overflow-hidden">
                    <img src="${storyData.coverImage || 'https://via.placeholder.com/150'}" alt="${displayName}" class="w-full h-full object-cover">
                </div>
            </div>
            <span class="text-xs mt-1 text-gray-900 font-medium max-w-[64px] truncate">${displayName}</span>
        `;
        storyDiv.addEventListener('click', () => openStoryViewer(userId));
        return storyDiv;
    }

    function handleStoryUpload(e) {
        e.preventDefault();
        const file = document.getElementById('story-file').files[0];
        if (!file) {
            alert('Por favor selecciona una imagen para tu relato');
            return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("Debes iniciar sesión para publicar un relato.");
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publicando...';

        const progressDiv = document.querySelector('.upload-progress');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressText = progressDiv.querySelector('.progress-text');
        progressDiv.style.display = 'block';

        progressText.textContent = 'Subiendo...';
        progressBar.style.width = '30%';

        // Subir imagen a Firebase Storage
        const storageRef = storage.ref('stories/' + currentUser.uid + '/' + Date.now() + '_' + file.name);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 70 + 30;
                progressBar.style.width = progress + '%';
            },
            (error) => {
                console.error("Error al subir imagen:", error);
                alert('Error al publicar la nota. Por favor intenta de nuevo.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Publicar Relato';
                progressDiv.style.display = 'none';
            },
            async () => {
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Guardar en Realtime Database
                    const storyData = {
                        userId: currentUser.uid,
                        username: currentUser.displayName || currentUser.email.split('@')[0],
                        email: currentUser.email,
                        coverImage: downloadURL,
                        timestamp: Date.now(),
                        views: 0
                    };

                    await database.ref('stories').push(storyData);
                    
                    progressBar.style.width = '100%';
                    progressText.textContent = '¡Relato publicado!';
                    
                    setTimeout(() => {
                        storyUploadModal.classList.remove('active');
                        resetUploadForm();
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Publicar Relato';
                        loadStories();
                    }, 500);
                } catch (error) {
                    console.error("Error al guardar en database:", error);
                    alert('Error al publicar la nota. Por favor intenta de nuevo.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Publicar Relato';
                    progressDiv.style.display = 'none';
                }
            }
        );
    }

    async function openStoryViewer(userId) {
        try {
            const snapshot = await database.ref('stories').orderByChild('userId').equalTo(userId).once('value');
            const stories = [];
            
            snapshot.forEach(child => {
                stories.push({ id: child.key, ...child.val() });
            });
            
            if (stories.length === 0) return;

            const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
            const recentStories = stories.filter(story => story.timestamp > twelveHoursAgo);
            
            if (recentStories.length === 0) return;

            const storyContent = document.querySelector('.story-content');
            storyContent.innerHTML = '';
            recentStories.sort((a, b) => a.timestamp - b.timestamp);
            
            let currentStoryIndex = 0;
            const currentUser = auth.currentUser;

            function showStory(index) {
                const story = recentStories[index];

                // Incrementar vistas
                if (currentUser && currentUser.uid !== userId) {
                    database.ref('stories/' + story.id + '/views').transaction(views => (views || 0) + 1);
                }

                const displayName = story.username || story.email?.split('@')[0] || 'Usuario';
                
                storyContent.innerHTML = `
                    <div class="story-header">
                        <div class="story-progress-container">
                            ${recentStories.map((_, i) => `<div class="story-progress"><div class="story-progress-bar" style="width: ${i < index ? '100%' : (i === index ? '0%' : '0%')}"></div></div>`).join('')}
                        </div>
                        <div class="story-user-info">
                            <span class="username">${displayName}</span>
                        </div>
                    </div>
                    <div class="story-top-controls">
                        <button class="story-close">×</button>
                        ${currentUser && currentUser.uid === userId ? `
                            <div class="story-options" data-story-id="${story.id}">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <circle cx="12" cy="5" r="2"/>
                                    <circle cx="12" cy="12" r="2"/>
                                    <circle cx="12" cy="19" r="2"/>
                                </svg>
                            </div>
                        ` : ''}
                    </div>
                    <img src="${story.coverImage}" class="story-image">
                    <div class="story-footer">
                        <div class="story-views">${story.views || 0} vistas</div>
                    </div>
                `;

                const progressBar = storyContent.querySelectorAll('.story-progress-bar')[index];
                setTimeout(() => progressBar.style.width = '100%', 100);

                storyContent.querySelector('.story-close').addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeStoryViewer();
                });

                const optionsButton = storyContent.querySelector('.story-options');
                if (optionsButton) {
                    optionsButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const storyIdToDelete = e.currentTarget.dataset.storyId;
                        
                        const menu = document.createElement('div');
                        menu.className = 'story-options-menu';
                        menu.innerHTML = `<button class="delete-option"><i class="fas fa-trash-alt"></i><span>Eliminar historia</span></button>`;
                        document.body.appendChild(menu);
                        setTimeout(() => menu.classList.add('active'), 10);
                        
                        menu.querySelector('.delete-option').addEventListener('click', async (e) => {
                            e.stopPropagation();
                            menu.remove();
                            await deleteStory(storyIdToDelete);
                        });
                    });
                }

                setTimeout(() => {
                    if (currentStoryIndex < recentStories.length - 1) {
                        currentStoryIndex++;
                        showStory(currentStoryIndex);
                    } else {
                        closeStoryViewer();
                    }
                }, 5000);
            }

            showStory(currentStoryIndex);
            storyViewer.classList.add('active');
        } catch (error) {
            console.error('Error opening story viewer:', error);
        }
    }

    async function deleteStory(storyId) {
        try {
            const snapshot = await database.ref('stories/' + storyId).once('value');
            const story = snapshot.val();
            
            if (story && story.coverImage) {
                const imageRef = storage.refFromURL(story.coverImage);
                await imageRef.delete();
            }
            
            await database.ref('stories/' + storyId).remove();
            closeStoryViewer();
            loadStories();
        } catch (error) {
            console.error("Error deleting story:", error);
            alert('Error al eliminar la historia');
        }
    }

    function closeStoryViewer() {
        storyViewer.classList.remove('active');
    }
});
