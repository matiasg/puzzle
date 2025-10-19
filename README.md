# Puzzle App

A web-based puzzle game where users arrange and rotate SVG pieces to solve puzzles.

## Features

- **Load puzzles from directories**: Provide a directory path containing `puzzle.json` and SVG files
- **Interactive piece manipulation**:
  - Click to select pieces
  - Drag and drop to move pieces
  - Rotate pieces by ±15 degrees using buttons or keyboard shortcuts (Q/E)
- **Solution checking**: Validates if pieces are in the correct position and rotation
- **Visual feedback**: Selected pieces are highlighted with a glow effect
- **Responsive design**: Works on desktop and mobile devices

## How to Use

⚠️ **Important**: This app requires a web server to work with local directories. Opening `index.html` directly from the file system will not work due to browser security restrictions.

### Method 1: Use the provided script (Recommended)
```bash
./serve.sh
```
Then open http://localhost:8000 in your browser.

### Method 2: Python server
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Method 3: Node.js server
```bash
npx http-server -p 8000
```

4. **Load a puzzle**: Click "Load Puzzle" and choose one of two methods:
   - **Method 1**: Enter the directory path (e.g., `sample-puzzle`)
   - **Method 2**: Upload `puzzle.json` and all SVG files manually
5. **Play the puzzle**:
   - Click on a piece to select it
   - Drag pieces to move them around
   - Use the rotation buttons or Q/E keys to rotate the selected piece
   - Click "Check Solution" to see if the puzzle is solved

### Testing with the Sample Puzzle
Start the server and enter `sample-puzzle` as the directory path to test with the provided 6-piece puzzle.

## Puzzle Format

Create a directory with the following structure:

```
puzzle-directory/
├── puzzle.json
├── piece1.svg
├── piece2.svg
└── ... (more SVG files)
```

### puzzle.json format

```json
[
    {
        "file": "piece1.svg",
        "x": 200,
        "y": 150
    },
    {
        "file": "piece2.svg",
        "x": 350,
        "y": 150
    }
]
```

Each object in the array represents a puzzle piece with:
- `file`: Name of the SVG file for this piece
- `x`: Target X coordinate where the piece's origin (0,0) should be placed
- `y`: Target Y coordinate where the piece's origin (0,0) should be placed

### SVG files

- SVG files should define the visual appearance of each puzzle piece
- The (0,0) point in the SVG coordinate system will be used as the piece's origin for positioning
- Pieces can be any shape or size

## Controls

- **Mouse/Touch**: Click/tap to select, drag to move
- **Q**: Rotate selected piece -5 degrees
- **E**: Rotate selected piece +5 degrees
- **Buttons**: Use the control buttons for rotation and checking solutions

## Solution Criteria

A puzzle is considered solved when:
1. Each piece is within 10 pixels of its target position (x, y)
2. Each piece is rotated within 2 degrees of its original orientation

## Sample Puzzle

A sample puzzle is provided in the `sample-puzzle/` directory to demonstrate the format and test the application.

## Browser Compatibility

This app works in modern browsers that support:
- ES6 JavaScript classes
- CSS Grid and Flexbox
- SVG rendering
- Touch events (for mobile)

## Loading Methods

### Method 1: Server Directory (Recommended)
- Use the `serve.sh` script or start your own HTTP server
- Enter the directory path relative to the server root (e.g., `sample-puzzle`)
- The app will automatically load `puzzle.json` and all SVG files from the directory

### Method 2: Manual File Upload
- Upload `puzzle.json` using the file input
- Select all SVG files using the multi-file input
- Works even when opening `index.html` directly from the file system
- No server required

## Technical Notes

- The app supports both server-based directory loading and manual file upload
- Method 1 requires a web server due to browser security restrictions
- Method 2 uses the File API and works without a server
- For the best experience, use the provided server script or start your own HTTP server
