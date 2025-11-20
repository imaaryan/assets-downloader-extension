if (!window.hasAssetDownloaderListener) {
  window.hasAssetDownloaderListener = true;
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_ASSETS") {
      const images = Array.from(document.images).map(img => ({
        type: 'image',
        src: img.src
      })).filter(item => item.src);

      const videos = Array.from(document.querySelectorAll('video')).map(video => {
        let src = video.src;
        if (!src && video.querySelector('source')) {
          src = video.querySelector('source').src;
        }
        return {
          type: 'video',
          src: src
        };
      }).filter(item => item.src);

      // Remove duplicates
      const uniqueAssets = [];
      const seen = new Set();
      [...images, ...videos].forEach(asset => {
        if (!seen.has(asset.src)) {
          seen.add(asset.src);
          uniqueAssets.push(asset);
        }
      });

      sendResponse({ assets: uniqueAssets });
    }
  });
}
