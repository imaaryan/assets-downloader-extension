# Asset Downloader Chrome Extension

A modern, lightweight Chrome extension to extract and download images and videos from any webpage. Built with a clean, user-friendly interface inspired by modern design principles.

## Features

- **Asset Extraction**: Automatically detects images and videos on the active tab.
- **Categorized View**: Separate tabs for Images and Videos.
- **Modern UI**: Clean, "Shadcn-like" interface with Light Mode and Orange accents.
- **Image Conversion**: Convert images to JPG, PNG, or WEBP formats before downloading.
- **Lightbox Preview**: Click any asset to view it in a full-size modal.
- **Batch Download**: Download all assets (original or converted) as a ZIP file.
- **Single Download**: Download individual assets with a single click.

## Installation

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the project directory.

## Usage

1.  Navigate to a website containing images or videos.
2.  Click the **Asset Downloader** icon in your Chrome toolbar.
3.  Browse found assets in the **Images** or **Video** tabs.
4.  **Download**: Click the download icon on an asset, or "Download All" for the entire list.
5.  **Convert**: Click the convert icon (arrows) on an image to select a format (JPG, PNG, WEBP).
6.  **Convert All**: Click "Convert All" to convert and download all images in the current tab as a ZIP.

## Technologies

- HTML, CSS, JavaScript (Vanilla)
- [JSZip](https://stuk.github.io/jszip/) for client-side zipping.
- Chrome Extensions API (Manifest V3).

## License

MIT
