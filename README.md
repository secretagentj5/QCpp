# Test Case Counter Chrome Extension

A Chrome extension to help track test cases and manage test-related snippets with different status tags.

## Features

- Counter to keep track of constant progress
- Multiple mini-counters with customization options
- Snippet management with Upto 8 customizable tags and colors
- Theme selection (Light/Dark)
- Export and import functionality to backup and restore your data
- Automatic link detection and highlighting
- Copy and delete functionality for snippets
- Reset button to clear counter and snippets
- Save image in snippet 

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar to open the popup
2. Use the + and - buttons to increment/decrement the test case counter
3. To add a snippet:
   - Select a status tag from the dropdown
   - Enter your text or paste a link in the text area
   - Click "Save Snippet" or "Paste" to paste and save in one step
4. To copy a snippet, click the 📋 button
5. To delete a snippet, click the 🗑️ button
6. To reset the main counter, click the reset button

## Settings

Click the ⚙️ icon to access settings:

1. **Counters**: Add, rename, hide, or delete counters
2. **Tags**: Add, rename, delete tags and customize their colors
3. **Theme**: Choose between Light and Dark themes
4. **Data Management**: Export or import your data
5. **Display Options**: Toggle visibility of various UI elements

## Data Management

- **Export Data**: Click "Export Data" to download a JSON file containing all your counters, snippets, and settings
- **Import Data**: Click "Import Data" to upload a previously exported JSON file and restore your data
  - Note: Importing data will replace all your current data

## Notes

- The counter and snippets are stored locally in your browser
- Links in snippets are automatically detected and made clickable
- The extension will remember your counter and snippets between browser sessions
- Regularly export your data to prevent loss when clearing browser data 
