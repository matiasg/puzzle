# Puzzle Generator & App

A comprehensive puzzle system that includes both a generator to create jigsaw puzzle pieces from images and a web-based puzzle game to solve them.

## Puzzle Generator

**NEW**: Convert your images into realistic jigsaw puzzle pieces!

### Features
- **Web Interface**: Browser-based generator for easy use
- **Multiple Input Formats**: Supports PNG, JPG, and other image formats
- **Realistic Puzzle Pieces**: Generates pieces with jigsaw-style tabs and blanks
- **Perfect Piece Matching**: Adjacent pieces have complementary tab/blank patterns
- **Optional Piece Numbers**: Control whether pieces show numbers (default: off)
- **One-Click Download**: Download all puzzle files as a convenient ZIP archive
- **Compatible Output**: Generates files that work with the puzzle app

### Quick Start

1. Open `web-generator.html` in your browser
2. Select an image file
3. Choose the puzzle grid size (columns × rows)
4. Optional: Check "Show piece numbers" for numbered pieces
5. Click "Generate Puzzle"
6. Download the generated puzzle files as a ZIP

## Puzzle App

A web-based puzzle game where users arrange and rotate SVG pieces to solve puzzles.

## Features

- **Load puzzles from directories**: Provide a directory path containing `puzzle.json` and SVG files
- **Interactive piece manipulation**:
  - Click to select pieces
  - Drag and drop to move pieces
  - Rotate pieces by ±15 degrees using buttons or Shift+click for 90 degrees
  - Mouse wheel zoom centered on cursor position
  - Keyboard controls: arrows to move, Ctrl+arrows to rotate
- **Solution modes**: Show hint (1.5x offset), show solution, or reset to play
- **Solution checking**: Validates if pieces are in the correct position and rotation
- **Visual feedback**: Selected pieces are highlighted
- **Responsive design**: Puzzle container adapts to window size (up to 1000x1000)

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

4. **Load a puzzle**: Click "Load Puzzle" and enter the directory path (e.g., `sample-puzzle`)
5. **Play the puzzle**:
   - Click on a piece to select it
   - Drag pieces to move them around
   - Use rotation buttons or keyboard shortcuts
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
- **Mouse wheel**: Zoom in/out (zooms centered on cursor)
- **Arrow keys**: Move selected piece by 1px (× zoom level)
- **Shift + Arrow keys**: Move selected piece by 10px (× zoom level)
- **Ctrl + Arrow Left/Right**: Rotate selected piece by 15 degrees
- **Ctrl + Shift + Arrow Left/Right**: Rotate selected piece by 90 degrees
- **Rotate buttons**: Click for ±15°, Shift+click for ±90°
- **Show Hint button**: Cycles through hint → show solution → reset

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

## Technical Notes

- The app requires a web server due to browser security restrictions with local file access
- Use the provided server script or start your own HTTP server
- Generated puzzle files from the web generator can be extracted and placed in a directory for loading
