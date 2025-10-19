// Simple puzzle app that loads JSON and SVG files

class SimplePuzzleApp {
    constructor() {
        this.puzzleData = null;
        this.pieces = [];
        this.selectedPiece = null;
        this.zoomLevel = 1; // 1 = 100%
        this.containerCenter = { x: 400, y: 250 }; // Center of 800x500 container
        this.isShowingSolution = false; // Toggle state
        this.initialState = null; // Store initial positions and rotations
        this.init();
    }

    init() {
        // Load button
        const loadBtn = document.getElementById('loadPuzzle');
        loadBtn.addEventListener('click', () => this.loadPuzzle());

        // Check button
        const checkBtn = document.getElementById('checkSolution');
        checkBtn.addEventListener('click', () => this.checkSolution());

        // Rotation buttons
        const rotateLeftBtn = document.getElementById('rotateLeft');
        const rotateRightBtn = document.getElementById('rotateRight');
        rotateLeftBtn.addEventListener('click', () => this.rotateSelected(-5));
        rotateRightBtn.addEventListener('click', () => this.rotateSelected(5));

        // Directory input
        const directoryInput = document.getElementById('directoryInput');
        const loadDirectoryBtn = document.getElementById('loadDirectory');
        loadDirectoryBtn.addEventListener('click', () => {
            const directory = directoryInput.value.trim();
            if (directory) {
                this.loadPuzzleFromDirectory(directory);
            }
        });

        // Modal controls
        const cancelBtn = document.getElementById('cancelLoad');
        const modal = document.getElementById('directoryModal');
        loadBtn.addEventListener('click', () => modal.classList.add('show'));
        cancelBtn.addEventListener('click', () => modal.classList.remove('show'));

        // Zoom controls
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        zoomInBtn.addEventListener('click', () => this.zoom(0.1)); // Zoom in by 10%
        zoomOutBtn.addEventListener('click', () => this.zoom(-0.1)); // Zoom out by 10%

        // Show solution button
        const showSolutionBtn = document.getElementById('showSolution');
        showSolutionBtn.addEventListener('click', () => this.toggleShowSolution());
    }

    async loadPuzzleFromDirectory(directory) {
        console.log('Loading puzzle from directory:', directory);

        try {
            // Step 1: Load puzzle.json
            console.log('Step 1: Loading puzzle.json...');
            const response = await fetch(`${directory}/puzzle.json`);
            if (!response.ok) {
                throw new Error(`Failed to load puzzle.json: ${response.status}`);
            }

            const jsonText = await response.text();
            console.log('puzzle.json content:', jsonText);

            this.puzzleData = JSON.parse(jsonText);
            console.log('Parsed puzzle data:', this.puzzleData);

            // Step 2: Load SVG files for each piece
            console.log('Step 2: Loading SVG files...');
            await this.loadSvgFiles(directory);

            // Store initial state and enable controls
            this.storeInitialState();
            document.getElementById('checkSolution').disabled = false;
            document.getElementById('showSolution').disabled = false;

            // Hide modal
            document.getElementById('directoryModal').classList.remove('show');

            // Show success message
            document.getElementById('status').textContent = `Puzzle loaded! ${this.pieces.length} pieces`;

        } catch (error) {
            console.error('Error loading puzzle:', error);
            document.getElementById('status').textContent = `Error: ${error.message}`;
        }
    }

    async loadSvgFiles(directory) {
        this.pieces = [];
        const container = document.getElementById('puzzleContainer');
        container.innerHTML = '';

        for (let i = 0; i < this.puzzleData.length; i++) {
            const pieceInfo = this.puzzleData[i];
            console.log(`Loading SVG ${i + 1}/${this.puzzleData.length}: ${pieceInfo.file}`);

            try {
                // Load SVG file
                const svgResponse = await fetch(`${directory}/${pieceInfo.file}`);
                if (!svgResponse.ok) {
                    throw new Error(`Failed to load ${pieceInfo.file}: ${svgResponse.status}`);
                }

                const svgText = await svgResponse.text();
                console.log(`Loaded ${pieceInfo.file}, length: ${svgText.length}`);

                // Create piece element
                const piece = this.createPiece(pieceInfo, svgText);

                // Verify piece and element were created successfully
                if (!piece || !piece.element) {
                    throw new Error(`Failed to create piece element for ${pieceInfo.file}`);
                }

                this.pieces.push(piece);
                container.appendChild(piece.element);

                console.log(`✓ Created piece for ${pieceInfo.file}`);

            } catch (error) {
                console.error(`Error loading ${pieceInfo.file}:`, error);
                throw error;
            }
        }
    }

    createPiece(pieceInfo, svgContent) {
        console.log(`Creating piece for ${pieceInfo.file}`);

        const piece = {
            file: pieceInfo.file,
            targetX: pieceInfo.x,
            targetY: pieceInfo.y,
            currentX: Math.round(Math.random() * 400 + 50), // Random integer position
            currentY: Math.round(Math.random() * 300 + 50),
            rotation: Math.floor(Math.random() * 8) * 5, // Random rotation in multiples of 5
            element: null
        };

        let element;

        try {
            // Create DOM element
            element = document.createElement('div');
            element.className = 'puzzle-piece';
            element.style.position = 'absolute';
            element.style.left = piece.currentX + 'px';
            element.style.top = piece.currentY + 'px';
            element.style.cursor = 'pointer';
            element.style.border = '2px solid transparent';
            element.innerHTML = svgContent;

            // Set element reference first
            piece.element = element;

            // Apply initial transform and zoom scaling
            this.updatePieceZoom(piece);

            console.log(`✓ Piece element created for ${pieceInfo.file}`);

        } catch (error) {
            console.error(`Error creating piece element for ${pieceInfo.file}:`, error);
            throw error;
        }

        // Add click handler
        element.addEventListener('click', () => {
            // Deselect previous
            if (this.selectedPiece) {
                this.selectedPiece.element.style.border = '2px solid transparent';
            }
            // Select new
            this.selectedPiece = piece;
            element.style.border = '2px solid blue';

            // Enable rotation buttons
            document.getElementById('rotateLeft').disabled = false;
            document.getElementById('rotateRight').disabled = false;
        });

        // Add drag handler
        let isDragging = false;
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', (e) => {
            // Select the piece when starting to drag
            if (this.selectedPiece && this.selectedPiece !== piece) {
                this.selectedPiece.element.style.border = '2px solid transparent';
            }
            this.selectedPiece = piece;
            element.style.border = '2px solid blue';

            // Enable rotation buttons
            document.getElementById('rotateLeft').disabled = false;
            document.getElementById('rotateRight').disabled = false;

            // Start dragging
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = piece.currentX;
            initialY = piece.currentY;
            e.preventDefault();
        });

              const self = this; // Store reference to the app instance

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            // Calculate movement in display coordinates
            const displayDeltaX = e.clientX - startX;
            const displayDeltaY = e.clientY - startY;

            // Convert to logical coordinates (divide by zoom scale)
            const logicalDeltaX = Math.round(displayDeltaX / self.zoomLevel);
            const logicalDeltaY = Math.round(displayDeltaY / self.zoomLevel);

            // Update logical position
            piece.currentX = initialX + logicalDeltaX;
            piece.currentY = initialY + logicalDeltaY;

            // Update display position
            self.updatePieceZoom(piece);
        };

        const handleMouseUp = () => {
            isDragging = false;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        piece.element = element;
        return piece;
    }

    storeInitialState() {
        // Store the initial positions and rotations of all pieces
        this.initialState = this.pieces.map(piece => ({
            file: piece.file,
            currentX: piece.currentX,
            currentY: piece.currentY,
            rotation: piece.rotation
        }));
        console.log('Initial state stored:', this.initialState);
    }

    toggleShowSolution() {
        const showBtn = document.getElementById('showSolution');

        if (!this.isShowingSolution) {
            // Show the solution: move pieces to target positions
            console.log('Showing solution...');
            this.pieces.forEach(piece => {
                piece.currentX = piece.targetX;
                piece.currentY = piece.targetY;
                piece.rotation = 0; // Reset rotation to solved state
                this.updatePieceZoom(piece);
            });

            showBtn.textContent = 'Hide Solution';
            showBtn.style.backgroundColor = '#dc3545'; // Red color
            this.isShowingSolution = true;

            document.getElementById('status').textContent = 'Solution shown - puzzle solved!';
            document.getElementById('status').style.color = 'green';

        } else {
            // Hide the solution: restore initial positions
            console.log('Hiding solution, restoring initial state...');
            if (this.initialState) {
                this.pieces.forEach(piece => {
                    const initialState = this.initialState.find(state => state.file === piece.file);
                    if (initialState) {
                        piece.currentX = initialState.currentX;
                        piece.currentY = initialState.currentY;
                        piece.rotation = initialState.rotation;
                        this.updatePieceZoom(piece);
                    }
                });
            }

            showBtn.textContent = 'Show Solution';
            showBtn.style.backgroundColor = '#007bff'; // Blue color
            this.isShowingSolution = false;

            document.getElementById('status').textContent = 'Solution hidden - continue playing!';
            document.getElementById('status').style.color = 'black';
        }
    }

    rotateSelected(degrees) {
        if (!this.selectedPiece) return;
        this.selectedPiece.rotation += degrees;
        this.updatePieceZoom(this.selectedPiece);
    }

    zoom(delta) {
        // Calculate new zoom level (between 0.5 and 2.0)
        const newZoom = Math.max(0.5, Math.min(2.0, this.zoomLevel + delta));

        if (newZoom !== this.zoomLevel) {
            this.zoomLevel = newZoom;

            // Update zoom level display
            document.getElementById('zoomLevel').textContent = Math.round(this.zoomLevel * 100) + '%';

            // Update all pieces
            for (const piece of this.pieces) {
                if (piece && piece.element) {
                    this.updatePieceZoom(piece);
                }
            }

            console.log(`Zoom level: ${Math.round(this.zoomLevel * 100)}%`);
        }
    }

    updatePieceZoom(piece) {
        if (!piece || !piece.element) {
            console.error('Cannot update zoom: piece or element is null');
            return;
        }

        const scale = this.zoomLevel;

        // Calculate display position (scaled from center)
        const displayX = this.containerCenter.x + (piece.currentX - this.containerCenter.x) * scale;
        const displayY = this.containerCenter.y + (piece.currentY - this.containerCenter.y) * scale;

        // Update element position
        piece.element.style.left = displayX + 'px';
        piece.element.style.top = displayY + 'px';

        // Apply transform with scale
        piece.element.style.transform = `rotate(${piece.rotation}deg) scale(${scale})`;
        piece.element.style.transformOrigin = 'center center';
    }

    checkSolution() {
        console.log('Checking solution...');
        let solved = true;

        if (this.pieces.length === 0) {
            document.getElementById('status').textContent = 'No pieces loaded';
            return;
        }

        // Get the first piece as reference
        const firstPiece = this.pieces[0];
        const currentRefX = firstPiece.currentX;
        const currentRefY = firstPiece.currentY;
        const targetRefX = firstPiece.targetX;
        const targetRefY = firstPiece.targetY;

        console.log(`Reference piece: ${firstPiece.file}`);
        console.log(`Current reference position: (${currentRefX}, ${currentRefY})`);
        console.log(`Target reference position: (${targetRefX}, ${targetRefY})`);

        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];

            // Calculate relative positions (using logical coordinates)
            const currentRelativeX = piece.currentX - currentRefX;
            const currentRelativeY = piece.currentY - currentRefY;
            const targetRelativeX = piece.targetX - targetRefX;
            const targetRelativeY = piece.targetY - targetRefY;

            // Check if relative positions match (within tolerance)
            const posCorrect = Math.abs(currentRelativeX - targetRelativeX) < 10 &&
                              Math.abs(currentRelativeY - targetRelativeY) < 10;
            const rotCorrect = piece.rotation % 360 === 0;

            console.log(`Piece ${piece.file}: logical(${piece.currentX}, ${piece.currentY}) relative(${currentRelativeX}, ${currentRelativeY}) vs target(${targetRelativeX}, ${targetRelativeY}) - pos=${posCorrect}, rot=${rotCorrect}`);

            if (!posCorrect || !rotCorrect) {
                solved = false;
            }
        }

        const status = document.getElementById('status');
        if (solved) {
            status.textContent = '🎉 Puzzle Solved!';
            status.style.color = 'green';
        } else {
            status.textContent = 'Puzzle not solved yet. Keep trying!';
            status.style.color = 'red';
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SimplePuzzleApp();
});