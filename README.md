# QC++ Chrome Extension

QC++ is a powerful Chrome extension designed for QA professionals and testers to efficiently manage test-related snippets, track execution counts, and organize information with customizable tags.

## Overview

QC++ provides an intuitive interface to:
- Track execution counts with multiple customizable counters
- Save and organize text snippets with different status tags
- Capture and store images directly in snippets
- Copy text and images to the clipboard with a single click
- Restore accidentally deleted snippets
- Customize appearance with light/dark themes

## Installation

### From Source Code
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "QC++"
3. Click "Add to Chrome"

## Features

### Counter Management
- **Main Counter**: Track execution counts with increment/decrement buttons
- **Additional Counters**: Create up to 6 custom counters with individual names
- **Counter Visibility**: Show/hide specific counters as needed

### Snippet Management
- **Text Snippets**: Save and organize text notes with different status tags
- **Image Snippets**: Capture and store images directly in the app
- **Tags**: Organize snippets with customizable tags (Created, Closed, Reopened, Note, etc.)
- **Double-Click Edit**: Quickly edit snippets by double-clicking
- **Link Detection**: Automatic URL detection and formatting as clickable links
- **10-Second Restore**: Recover accidentally deleted snippets within 10 seconds

### Clipboard Integration
- **One-Click Copy**: Copy text or images to clipboard
- **Paste Support**: Paste text and images directly from clipboard
- **Multi-Format Copy**: Copy both text and image content

### UI Customization
- **Theme Selection**: Choose between Light and Dark themes
- **Display Options**: Toggle visibility of timestamps, tags, filters, etc.
- **Responsive Design**: Adapts to different screen sizes and layouts

## How to Use

### Basic Operations
1. **Increment/Decrement Counter**: Use the +/- buttons in the header
2. **Reset Counter**: Click the circular arrow button
3. **Save a Snippet**:
   - Type text in the textarea or upload an image
   - Select a tag from the dropdown
   - Click the save button
4. **Edit a Snippet**: Double-click on any snippet to edit its content
   - Press Enter to save (Shift+Enter for new lines)
   - Click outside to save automatically
5. **Delete a Snippet**: Click the trash icon on any snippet
   - Use the "Restore" popup within 10 seconds to undo deletion
6. **Copy Snippet Content**: Click the copy icon to copy text to clipboard

### Settings Panel
Access settings by clicking the gear icon in the top-right corner:

#### Counters
- **Rename Counters**: Change the name of any counter
- **Add Counter**: Create additional custom counters
- **Hide Counter**: Toggle visibility of specific counters
- **Delete Counter**: Remove additional counters

#### Tags
- **Customize Tags**: Activate/deactivate tags to control which ones appear in the dropdown
- **Rename Tags**: Change the names of the built-in tags

#### Theme
- **Light/Dark Mode**: Switch between light and dark color schemes

#### Data Management
- **Export Data**: Backup all your counters, snippets, and settings to a JSON file
- **Import Data**: Restore previously exported data

#### Display Options
- **Toggle Timestamp**: Show/hide timestamps on snippets
- **Toggle Filters**: Show/hide date, tag, and search filters
- **Toggle Double-Click Edit**: Enable/disable editing by double-clicking

## File Structure

```
QC++/
├── manifest.json       # Extension configuration and permissions
├── popup.html          # Main extension UI
├── popup.js            # Core application logic
├── styles.css          # Styling for the extension
├── background.js       # Background scripts for extension
└── icons/              # Extension icons in various sizes
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Key Components

- **manifest.json**: Defines extension metadata, permissions, and resources
- **popup.html**: Contains the HTML structure of the extension popup
- **popup.js**: Implements all functionality including:
  - Counter management
  - Snippet saving, editing, and deletion
  - Image handling and clipboard operations
  - Settings and data storage
- **styles.css**: Provides styling for both light and dark themes
- **background.js**: Handles background processes and extension lifecycle

## Data Storage

All data is stored locally in Chrome's storage API:
- Snippets (text and images)
- Counter values
- User preferences
- Tag configurations

Make regular backups using the Export Data feature to prevent data loss.

## Permissions

QC++ requires the following permissions:
- **storage**: To save your snippets, counters, and settings
- **clipboardRead/clipboardWrite**: To allow copying and pasting text and images

## Support

For issues, feature requests, or contributions, please create an issue on the GitHub repository. 