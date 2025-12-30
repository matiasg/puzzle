// Simple puzzle app that loads JSON and SVG files

class SimplePuzzleApp {
    constructor() {
        this.puzzleData = null;
        this.pieces = [];
        this.selectedPiece = null;
        this.zoomLevel = 1; // 1 = 100%
        this.containerCenter = { x: 400, y: 250 }; // Center of 800x500 container
        this.panOffset = { x: 0, y: 0 }; // Pan offset to keep zoom centered on cursor
        this.solutionMode = 0; // 0 = normal, 1 = show solution, 2 = show hint (1.5x offset)
        this.initialState = null; // Store initial positions and rotations
        this.init();
    }

    init() {
        // Initialize container size based on window
        this.updateContainerSize();

        // Listen for window resize
        window.addEventListener('resize', () => this.updateContainerSize());

        // Load button
        const loadBtn = document.getElementById('loadPuzzle');

        // Check button
        const checkBtn = document.getElementById('checkSolution');
        checkBtn.addEventListener('click', () => this.checkSolution());

        // Rotation buttons
        const rotateLeftBtn = document.getElementById('rotateLeft');
        const rotateRightBtn = document.getElementById('rotateRight');
        rotateLeftBtn.addEventListener('click', (e) => {
            const degrees = e.shiftKey ? -90 : -15;
            this.rotateSelected(degrees);
        });
        rotateRightBtn.addEventListener('click', (e) => {
            const degrees = e.shiftKey ? 90 : 15;
            this.rotateSelected(degrees);
        });

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
        zoomInBtn.addEventListener('click', () => {
            this.panOffset = { x: 0, y: 0 }; // Reset pan to center
            this.zoom(0.1);
        });
        zoomOutBtn.addEventListener('click', () => {
            this.panOffset = { x: 0, y: 0 }; // Reset pan to center
            this.zoom(-0.1);
        });

        // Show solution button
        const showSolutionBtn = document.getElementById('showSolution');
        showSolutionBtn.addEventListener('click', () => this.toggleShowSolution());

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Mouse wheel zoom on puzzle container
        const container = document.getElementById('puzzleContainer');
        container.addEventListener('wheel', (e) => {
            e.preventDefault();

            // Get mouse position relative to container
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate zoom delta (scrolling down zooms out, up zooms in)
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(delta, mouseX, mouseY);
        }, { passive: false });
    }

    updateContainerSize() {
        const container = document.getElementById('puzzleContainer');
        if (!container) return;

        // Calculate available space (subtracting margins and header space)
        const maxWidth = window.innerWidth - 40; // 20px margin on each side
        const maxHeight = window.innerHeight - 200; // Space for header, controls, status

        // Use smaller of default size (1000x1000) or available space
        const width = Math.min(1000, maxWidth);
        const height = Math.min(1000, maxHeight);

        // Actually set the container size
        container.style.width = width + 'px';
        container.style.height = height + 'px';

        // Update container center
        this.containerCenter = { x: width / 2, y: height / 2 };

        // If pan offset is at initial position, reset it
        if (this.panOffset.x === 0 && this.panOffset.y === 0) {
            // panOffset stays at 0,0 (centered)
        }

        // Update all pieces if they exist
        if (this.pieces.length > 0) {
            for (const piece of this.pieces) {
                if (piece && piece.element) {
                    this.updatePieceZoom(piece);
                }
            }
        }

        console.log(`Container size updated: ${Math.round(width)}x${Math.round(height)}, center: (${Math.round(this.containerCenter.x)}, ${Math.round(this.containerCenter.y)})`);
    }

    handleKeyDown(e) {
        if (!this.selectedPiece) return;

        // Check if Ctrl is pressed for rotation
        if (e.ctrlKey) {
            // Rotation mode
            const rotationDegrees = e.shiftKey ? 90 : 15;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.selectedPiece.rotation -= rotationDegrees;
                    this.updatePieceZoom(this.selectedPiece);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.selectedPiece.rotation += rotationDegrees;
                    this.updatePieceZoom(this.selectedPiece);
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                    e.preventDefault();
                    // In rotation mode, up/down could also rotate (optional)
                    break;
            }
        } else {
            // Movement mode
            const moveDistance = (e.shiftKey ? 10 : 1) * this.zoomLevel;

            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedPiece.currentY -= moveDistance;
                    this.updatePieceZoom(this.selectedPiece);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedPiece.currentY += moveDistance;
                    this.updatePieceZoom(this.selectedPiece);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.selectedPiece.currentX -= moveDistance;
                    this.updatePieceZoom(this.selectedPiece);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.selectedPiece.currentX += moveDistance;
                    this.updatePieceZoom(this.selectedPiece);
                    break;
            }
        }
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
            rotation: Math.floor(Math.random() * 12) * 15, // Random rotation in multiples of 5
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

            // Parse SVG content properly to handle complex SVG structures
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

            // Check for parsing errors
            const parserError = svgDoc.querySelector('parsererror');
            if (parserError) {
                console.warn(`SVG parsing warning for ${pieceInfo.file}, falling back to innerHTML`);
                element.innerHTML = svgContent;
            } else {
                // Create a unique prefix for this piece to avoid ID conflicts
                const pieceId = pieceInfo.file.replace(/\.[^/.]+$/, ""); // Remove extension
                const uniquePrefix = `piece_${pieceId}_`;

                // Clone the SVG document to modify it
                const modifiedSvgDoc = svgDoc.cloneNode(true);

                // Make all IDs unique to avoid conflicts between pieces
                const elementsWithIds = modifiedSvgDoc.querySelectorAll('[id]');
                elementsWithIds.forEach(el => {
                    const oldId = el.getAttribute('id');
                    el.setAttribute('id', uniquePrefix + oldId);
                });

                // Update all references to IDs (href, url(), etc.)
                const elementsWithReferences = modifiedSvgDoc.querySelectorAll('[href], [clip-path], [fill], [stroke], [mask], [filter]');
                elementsWithReferences.forEach(el => {
                    // Update href attributes
                    if (el.hasAttribute('href')) {
                        const href = el.getAttribute('href');
                        if (href.startsWith('#')) {
                            el.setAttribute('href', '#' + uniquePrefix + href.substring(1));
                        }
                    }

                    // Update clip-path attributes
                    if (el.hasAttribute('clip-path')) {
                        const clipPath = el.getAttribute('clip-path');
                        const urlMatch = clipPath.match(/url\(#([^)]+)\)/);
                        if (urlMatch) {
                            el.setAttribute('clip-path', `url(#${uniquePrefix + urlMatch[1]})`);
                        }
                    }

                    // Update style references
                    ['fill', 'stroke', 'mask', 'filter'].forEach(attr => {
                        if (el.hasAttribute(attr)) {
                            const value = el.getAttribute(attr);
                            const urlMatch = value.match(/url\(#([^)]+)\)/);
                            if (urlMatch) {
                                el.setAttribute(attr, `url(#${uniquePrefix + urlMatch[1]})`);
                            }
                        }
                    });
                });

                // Create a wrapper div for the SVG to ensure proper rendering
                const svgWrapper = document.createElement('div');
                svgWrapper.style.width = '100%';
                svgWrapper.style.height = '100%';
                svgWrapper.style.overflow = 'visible';

                // Import and append the modified SVG element
                const svgElement = modifiedSvgDoc.documentElement;
                if (svgElement && svgElement.tagName.toLowerCase() === 'svg') {
                    // Ensure proper SVG namespace and attributes
                    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    svgElement.style.width = '100%';
                    svgElement.style.height = '100%';
                    svgElement.style.display = 'block';

                    // Import the SVG into the main document
                    const importedSvg = document.importNode(svgElement, true);
                    svgWrapper.appendChild(importedSvg);
                    element.appendChild(svgWrapper);

                    console.log(`✓ Successfully processed ${pieceInfo.file} with unique IDs`);
                } else {
                    // Fallback to innerHTML if SVG element not found
                    console.warn(`Could not extract SVG element from ${pieceInfo.file}, using innerHTML`);
                    element.innerHTML = svgContent;
                }
            }

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

        // Cycle through modes: 0 -> 2 -> 1 -> 0 (hint -> show -> reset)
        // After mode 2 comes mode 1, then back to 0
        if (this.solutionMode === 0) {
            this.solutionMode = 2; // Go to hint first
        } else if (this.solutionMode === 2) {
            this.solutionMode = 1; // Then show solution
        } else {
            this.solutionMode = 0; // Then reset
        }

        if (this.solutionMode === 2) {
            // Store current state before showing hint
            this.preSolutionState = this.pieces.map(piece => ({
                file: piece.file,
                currentX: piece.currentX,
                currentY: piece.currentY,
                rotation: piece.rotation
            }));
            console.log('Pre-solution state stored:', this.preSolutionState);

            // Show hint: solution with 1.5x offset
            console.log('Showing hint (1.5x offset)...');
            this.pieces.forEach(piece => {
                piece.currentX = piece.targetX * 1.5;
                piece.currentY = piece.targetY * 1.5;
                piece.rotation = 0; // Reset rotation to solved state
                this.updatePieceZoom(piece);
            });

            showBtn.textContent = 'Show Solution';
            showBtn.style.backgroundColor = '#fd7e14'; // Orange color

            document.getElementById('status').textContent = 'Hint shown - pieces at 1.5x offset!';
            document.getElementById('status').style.color = 'orange';

        } else if (this.solutionMode === 1) {
            // Show the solution: move pieces to target positions
            console.log('Showing solution...');
            this.pieces.forEach(piece => {
                piece.currentX = piece.targetX;
                piece.currentY = piece.targetY;
                piece.rotation = 0; // Reset rotation to solved state
                this.updatePieceZoom(piece);
            });

            showBtn.textContent = 'Reset';
            showBtn.style.backgroundColor = '#dc3545'; // Red color

            document.getElementById('status').textContent = 'Solution shown - puzzle solved!';
            document.getElementById('status').style.color = 'green';

        } else {
            // Reset to normal: restore positions from when solution was shown
            console.log('Resetting to normal, restoring pre-solution state...');
            if (this.preSolutionState) {
                this.pieces.forEach(piece => {
                    const preSolutionState = this.preSolutionState.find(state => state.file === piece.file);
                    if (preSolutionState) {
                        piece.currentX = preSolutionState.currentX;
                        piece.currentY = preSolutionState.currentY;
                        piece.rotation = preSolutionState.rotation;
                        this.updatePieceZoom(piece);
                    }
                });
            }

            showBtn.textContent = 'Show Hint';
            showBtn.style.backgroundColor = '#007bff'; // Blue color

            document.getElementById('status').textContent = 'Solution hidden - continue playing!';
            document.getElementById('status').style.color = 'black';
        }
    }

    rotateSelected(degrees) {
        if (!this.selectedPiece) return;
        this.selectedPiece.rotation += degrees;
        this.updatePieceZoom(this.selectedPiece);
    }

    zoom(delta, mouseX = null, mouseY = null) {
        const oldZoom = this.zoomLevel;

        // Calculate new zoom level (between 0.2 and 10.0)
        const newZoom = Math.max(0.2, Math.min(10.0, this.zoomLevel + delta));

        if (newZoom !== this.zoomLevel) {
            // If mouse position is provided, adjust pan offset to keep cursor stationary
            if (mouseX !== null && mouseY !== null) {
                // t(p) = z * p + o
                // nt(p) = nz * p + no
                // t(m) = nt(m) => z * m + o = nz * m + no
                // no = z * m + o - nz * m = (z - nz) * m + o

                this.panOffset.x = (oldZoom - newZoom) * mouseX + this.panOffset.x;
                this.panOffset.y = (oldZoom - newZoom) * mouseY + this.panOffset.y;

                // Update zoom level
                this.zoomLevel = newZoom;
            } else {
                this.zoomLevel = newZoom;
            }

            // Update zoom level display
            document.getElementById('zoomLevel').textContent = Math.round(this.zoomLevel * 100) + '%';

            // Update all pieces
            for (const piece of this.pieces) {
                if (piece && piece.element) {
                    this.updatePieceZoom(piece);
                }
            }

            console.log(`Zoom level: ${Math.round(this.zoomLevel * 100)}%, pan offset: (${Math.round(this.panOffset.x)}, ${Math.round(this.panOffset.y)})`);
        }
    }

    updatePieceZoom(piece) {
        if (!piece || !piece.element) {
            console.error('Cannot update zoom: piece or element is null');
            return;
        }

        const scale = this.zoomLevel;

        // t(p) = z * p + o
        // nt(p) = nz * p + no
        // t(m) = nt(m) => z * m + o = nz * m + no
        // no = z * m + o - nz * m = (z - nz) * m + o

        const displayX = this.zoomLevel * piece.currentX + this.panOffset.x;
        const displayY = this.zoomLevel * piece.currentY + this.panOffset.y;

        // Update element position
        piece.element.style.left = displayX + 'px';
        piece.element.style.top = displayY + 'px';

        // Apply transform with scale
        piece.element.style.transform = `rotate(${piece.rotation}deg) scale(${scale})`;
        piece.element.style.transformOrigin = 'left top';
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
