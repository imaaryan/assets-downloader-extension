document.addEventListener('DOMContentLoaded', async () => {
  // State
  let currentCategory = 'images'; // 'images' or 'videos'
  let allAssets = [];

  // Tab Switching Logic
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  const downloadAllBtn = document.getElementById('download-all-btn');

  function updateDownloadButton() {
    const count = allAssets.filter(a => a.type === (currentCategory === 'images' ? 'image' : 'video')).length;
    const text = currentCategory === 'images' ? 'Images' : 'Videos';
    downloadAllBtn.innerText = `Download All ${text} (${count})`;
    downloadAllBtn.disabled = count === 0;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      currentCategory = tabName;
      
      const targetId = tabName === 'images' ? 'images-view' : 'videos-view';
      document.getElementById(targetId).classList.add('active');

      updateDownloadButton();
    });
  });

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    console.error("No active tab found");
    return;
  }

  // Inject content script if not already present
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (e) {
    console.log("Script might already be injected or cannot inject:", e);
  }

  // Request assets
  chrome.tabs.sendMessage(tab.id, { action: "GET_ASSETS" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      document.querySelector('.content-area').innerHTML = `<div class="empty-state">Error connecting to page. Try reloading the page.</div>`;
      return;
    }

    if (response && response.assets) {
      renderAssets(response.assets);
    } else {
      document.querySelector('.content-area').innerHTML = `<div class="empty-state">No assets found.</div>`;
    }
  });

  const imageList = document.getElementById('image-list');
  const videoList = document.getElementById('video-list');

  function renderAssets(assets) {
    allAssets = assets;
    const images = assets.filter(a => a.type === 'image');
    const videos = assets.filter(a => a.type === 'video');

    renderCategory(images, imageList, 'image');
    renderCategory(videos, videoList, 'video');
    
    // Update tab counts
    document.querySelector('[data-tab="images"]').textContent = `Images (${images.length})`;
    document.querySelector('[data-tab="videos"]').textContent = `Video (${videos.length})`;

    updateDownloadButton();
  }

  function renderCategory(items, container, type) {
    container.innerHTML = ''; // Clear previous content
    
    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">No ${type}s found.</div>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'asset-card';

      let preview;
      if (type === 'image') {
        preview = document.createElement('img');
        preview.src = item.src;
      } else {
        preview = document.createElement('video');
        preview.src = item.src;
        preview.controls = false; // Just a preview
        preview.muted = true;
        preview.addEventListener('mouseenter', () => preview.play().catch(() => {}));
        preview.addEventListener('mouseleave', () => {
          preview.pause();
          preview.currentTime = 0;
        });
      }
      preview.className = 'asset-preview';

      const overlay = document.createElement('div');
      overlay.className = 'asset-overlay';

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-icon-btn';
      downloadBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      `;
      downloadBtn.onclick = (e) => {
        e.stopPropagation();
        downloadSingle(item.src);
      };

      overlay.appendChild(downloadBtn);
      card.appendChild(preview);
      card.appendChild(overlay);
      
      // Lightbox click handler
      card.onclick = () => openLightbox(item.src, type);
      
      container.appendChild(card);
    });
  }

  // Lightbox Logic
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxVideo = document.getElementById('lightbox-video');
  const closeBtn = document.querySelector('.lightbox-close');

  function openLightbox(src, type) {
    lightbox.style.display = 'flex';
    // Trigger reflow for transition
    setTimeout(() => lightbox.classList.add('visible'), 10);

    if (type === 'image') {
      lightboxImg.src = src;
      lightboxImg.style.display = 'block';
      lightboxVideo.style.display = 'none';
      lightboxVideo.pause();
    } else {
      lightboxVideo.src = src;
      lightboxVideo.style.display = 'block';
      lightboxImg.style.display = 'none';
    }
  }

  function closeLightbox() {
    lightbox.classList.remove('visible');
    setTimeout(() => {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
      lightboxVideo.src = '';
      lightboxVideo.pause();
    }, 300);
  }

  closeBtn.onclick = closeLightbox;
  lightbox.onclick = (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  };


  function downloadSingle(url) {
    chrome.downloads.download({
      url: url
    });
  }

  downloadAllBtn.addEventListener('click', async () => {
    // Filter assets based on current category
    const assetsToDownload = allAssets.filter(a => a.type === (currentCategory === 'images' ? 'image' : 'video'));

    if (assetsToDownload.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder(currentCategory);
    
    const originalText = downloadAllBtn.innerText;
    downloadAllBtn.innerText = "Zipping...";
    downloadAllBtn.disabled = true;

    // Fetch assets
    const promises = assetsToDownload.map(async (asset, index) => {
      try {
        const response = await fetch(asset.src);
        const blob = await response.blob();
        
        // Guess extension
        let ext = asset.type === 'image' ? 'jpg' : 'mp4';
        const mime = blob.type;
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('jpeg')) ext = 'jpg';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('svg')) ext = 'svg';
        else if (mime.includes('webp')) ext = 'webp';
        
        const filename = `${currentCategory}_${index + 1}.${ext}`;
        folder.file(filename, blob);
      } catch (e) {
        console.error("Failed to fetch asset:", asset.src, e);
      }
    });

    await Promise.all(promises);

    zip.generateAsync({ type: "blob" }).then(function(content) {
      const url = URL.createObjectURL(content);
      
      chrome.downloads.download({
        url: url,
        filename: `${currentCategory}.zip`,
        saveAs: true
      }, () => {
        URL.revokeObjectURL(url);
        downloadAllBtn.innerText = originalText;
        downloadAllBtn.disabled = false;
      });
    });
  });
});
