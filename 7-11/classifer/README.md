# YouTube Video Classifier Extension

A Chrome extension that allows you to classify YouTube videos into different categories using a drag-and-drop interface.

## Features

- **Drag & Drop Interface**: Easily classify videos by dragging them into category bins
- **5 Categories**: Entertainment, Study, Motivation, How To, Money & Career
- **Data Export**: Classified videos are saved in the same format as your data.json file
- **Modern UI**: Clean, responsive design that matches YouTube's aesthetic
- **Real-time Updates**: Works on any YouTube video page

## Installation

1. **Download the Extension Files**
   - Make sure all files are in the `classifer` folder:
     - `manifest.json`
     - `content.js`
     - `styles.css`
     - `README.md`

2. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `classifer` folder
   - The extension should now appear in your extensions list

3. **Verify Installation**
   - Go to any YouTube video page
   - You should see a red "Classify" button in the bottom right corner

## How to Use

1. **Navigate to a YouTube Video**
   - Go to any YouTube video page
   - The extension automatically detects the video

2. **Open the Classifier**
   - Click the red "Classify" button in the bottom right
   - A modal will appear with the video information and category bins

3. **Classify the Video**
   - Drag the video card from the top section
   - Drop it into one of the category bins:
     - **Entertainment**: Movies, music, comedy, etc.
     - **Study**: Educational content, tutorials, academic videos
     - **Motivation**: Inspirational speeches, self-improvement
     - **How To**: Tutorials, guides, instructional content
     - **Money & Career**: Business, finance, career advice

4. **View Results**
   - Classified videos appear in their respective bins
   - A success notification will appear
   - Data is automatically saved to Chrome storage

## Data Format

The extension saves classified videos in the same format as your `data.json` file:

```json
{
    "title": "Video Title",
    "description": "Video Description",
    "label": "Category"
}
```

## Exporting Data

To export your classified videos:

1. Open Chrome DevTools (F12)
2. Go to Application tab → Storage → Local Storage
3. Look for the extension's storage data
4. Copy the `classifiedVideos` array

## Troubleshooting

- **Button not appearing**: Make sure you're on a YouTube video page
- **Can't drag video**: Try refreshing the page
- **Extension not loading**: Check that all files are in the correct folder

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Only requires access to YouTube pages and local storage
- **Compatibility**: Works with all modern YouTube layouts
- **Performance**: Lightweight with minimal impact on page performance

## Customization

You can modify the categories by editing the `categories` array in `content.js`:

```javascript
this.categories = ["Entertainment", "Study", "Motivation", "How To", "Money & Career"];
```

## Support

If you encounter any issues:
1. Check that all files are present in the folder
2. Ensure the extension is properly loaded in Chrome
3. Try refreshing the YouTube page
4. Check the browser console for any error messages 