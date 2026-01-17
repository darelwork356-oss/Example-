// firebase-functions.js - TODAS las funciones con Firebase

// ========== PERFIL ==========
async function loadProfileStats(userId) {
  try {
    const snapshot = await firebase.database().ref('users/' + userId).once('value');
    const userData = snapshot.val();
    
    // Contar historias
    const storiesSnap = await firebase.database().ref('stories').orderByChild('userId').equalTo(userId).once('value');
    const storiesCount = storiesSnap.numChildren();
    
    // Contar notas
    const notesSnap = await firebase.database().ref('communityNotes').orderByChild('userId').equalTo(userId).once('value');
    const notesCount = notesSnap.numChildren();
    
    // Contar seguidores
    const followersSnap = await firebase.database().ref('followers/' + userId).once('value');
    const followersCount = followersSnap.numChildren();
    
    // Contar siguiendo
    const followingSnap = await firebase.database().ref('following/' + userId).once('value');
    const followingCount = followingSnap.numChildren();
    
    return {
      stories: storiesCount,
      notes: notesCount,
      followers: followersCount,
      following: followingCount,
      userData: userData
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// ========== SEGUIR/DEJAR DE SEGUIR ==========
async function toggleFollow(userId) {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    alert('Debes iniciar sesión');
    return;
  }
  
  try {
    const followingRef = firebase.database().ref('following/' + currentUser.uid + '/' + userId);
    const snapshot = await followingRef.once('value');
    
    if (snapshot.exists()) {
      // Dejar de seguir
      await followingRef.remove();
      await firebase.database().ref('followers/' + userId + '/' + currentUser.uid).remove();
      return false;
    } else {
      // Seguir
      await followingRef.set(true);
      await firebase.database().ref('followers/' + userId + '/' + currentUser.uid).set(true);
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar');
  }
}

// ========== CARGAR HISTORIAS DEL INICIO ==========
async function loadHomeStories() {
  try {
    const sections = [
      { id: 'new-releases', ref: 'stories', limit: 10 },
      { id: 'top10', ref: 'stories', limit: 10 },
      { id: 'popular', ref: 'stories', limit: 10 },
      { id: 'terror-stories', ref: 'stories', limit: 10 },
      { id: 'trending-stories', ref: 'stories', limit: 10 },
      { id: 'mystery-stories', ref: 'stories', limit: 10 },
      { id: 'adventure-stories', ref: 'stories', limit: 10 },
      { id: 'suggested-stories', ref: 'stories', limit: 10 }
    ];
    
    for (const section of sections) {
      const snapshot = await firebase.database().ref(section.ref).limitToLast(section.limit).once('value');
      const container = document.getElementById(section.id);
      
      if (container) {
        container.innerHTML = '';
        const stories = [];
        
        snapshot.forEach(child => {
          stories.push({ id: child.key, ...child.val() });
        });
        
        stories.reverse().forEach(story => {
          const card = document.createElement('div');
          card.className = 'story-card cursor-pointer';
          card.innerHTML = `
            <div class="story-cover-container">
              <img src="${story.coverImage || 'https://via.placeholder.com/150'}" 
                   class="story-cover-image" 
                   alt="${story.title || 'Historia'}">
            </div>
            <h3 class="text-sm font-semibold mt-2 line-clamp-2">${story.title || 'Sin título'}</h3>
            <p class="text-xs text-gray-500">${story.username || 'Anónimo'}</p>
          `;
          card.onclick = () => openStoryDetail(story);
          container.appendChild(card);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// ========== CARGAR AUTORES DESTACADOS ==========
async function loadFeaturedAuthors() {
  try {
    const snapshot = await firebase.database().ref('users').limitToLast(10).once('value');
    const container = document.getElementById('featured-authors');
    
    if (container) {
      container.innerHTML = '';
      
      snapshot.forEach(child => {
        const user = child.val();
        const card = document.createElement('div');
        card.className = 'story-card cursor-pointer';
        card.innerHTML = `
          <img src="${user.profileImage || 'https://via.placeholder.com/150'}" 
               class="w-32 h-32 rounded-full object-cover mx-auto" 
               alt="${user.username}">
          <p class="text-sm font-semibold mt-2 text-center">${user.username || 'Usuario'}</p>
        `;
        card.onclick = () => openAuthorProfile(child.key);
        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// ========== SUBIR IMAGEN DE PERFIL ==========
async function uploadProfileImage(file) {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) return null;
  
  try {
    const storageRef = firebase.storage().ref('profiles/' + currentUser.uid + '/' + Date.now() + '_' + file.name);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    await firebase.database().ref('users/' + currentUser.uid + '/profileImage').set(downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// ========== ACTUALIZAR PERFIL ==========
async function updateProfile(data) {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) return false;
  
  try {
    await firebase.database().ref('users/' + currentUser.uid).update(data);
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// ========== CARGAR SEGUIDORES ==========
async function loadFollowers(userId) {
  try {
    const snapshot = await firebase.database().ref('followers/' + userId).once('value');
    const followers = [];
    
    for (const key of Object.keys(snapshot.val() || {})) {
      const userSnap = await firebase.database().ref('users/' + key).once('value');
      if (userSnap.exists()) {
        followers.push({ id: key, ...userSnap.val() });
      }
    }
    
    return followers;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// ========== CARGAR SIGUIENDO ==========
async function loadFollowing(userId) {
  try {
    const snapshot = await firebase.database().ref('following/' + userId).once('value');
    const following = [];
    
    for (const key of Object.keys(snapshot.val() || {})) {
      const userSnap = await firebase.database().ref('users/' + key).once('value');
      if (userSnap.exists()) {
        following.push({ id: key, ...userSnap.val() });
      }
    }
    
    return following;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// ========== CARGAR FOTOS DE COMUNIDAD ==========
async function loadPhotos() {
  try {
    const snapshot = await firebase.database().ref('communityNotes').orderByChild('timestamp').limitToLast(50).once('value');
    const container = document.getElementById('photos-grid');
    
    if (container) {
      container.innerHTML = '';
      const notes = [];
      
      snapshot.forEach(child => {
        const note = child.val();
        if (note.imageUrl) {
          notes.push({ id: child.key, ...note });
        }
      });
      
      notes.reverse().forEach(note => {
        const img = document.createElement('img');
        img.src = note.imageUrl;
        img.className = 'w-full aspect-square object-cover cursor-pointer';
        img.onclick = () => openNoteDetail(note);
        container.appendChild(img);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// ========== ABRIR DETALLE DE NOTA ==========
function openNoteDetail(note) {
  alert('Nota de: ' + note.authorName + '\n\n' + note.content);
}

// ========== ABRIR PERFIL DE AUTOR ==========
async function openAuthorProfile(userId) {
  const stats = await loadProfileStats(userId);
  if (stats) {
    alert('Perfil de: ' + (stats.userData?.username || 'Usuario') + 
          '\nHistorias: ' + stats.stories +
          '\nSeguidores: ' + stats.followers);
  }
}

// ========== ABRIR DETALLE DE HISTORIA ==========
function openStoryDetail(story) {
  alert('Historia: ' + (story.title || 'Sin título') + 
        '\nAutor: ' + (story.username || 'Anónimo'));
}

// ========== INICIALIZAR AL CARGAR ==========
document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      loadHomeStories();
      loadFeaturedAuthors();
    }
  });
});

console.log('✅ Firebase Functions cargadas');
