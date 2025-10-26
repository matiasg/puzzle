#!/usr/bin/env node

/**
 * Puzzle Piece Generator
 * Converts PNG or SVG images into jigsaw puzzle pieces with tabs and blanks
 *
 * Usage: node puzzle-generator.js <input-image> <columns> <rows> <output-dir>
 * Example: node puzzle-generator.js image.jpg 3 2 my-puzzle
 */

const fs = require('fs');
const path = require('path');

// For PNG processing - requires these npm packages:
// npm install canvas sharp jimp
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

class PuzzleGenerator {
    constructor(imagePath, cols, rows, outputDir) {
        this.imagePath = imagePath;
        this.cols = cols;
        this.rows = rows;
        this.outputDir = outputDir;
        this.pieceWidth = 100; // Standard piece size
        this.pieceHeight = 100;
        this.tabSize = 20; // Size of tabs/blanks
    }

    async generate() {
        console.log('🧩 Generating puzzle pieces...');

        // Create output directory
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const fileExt = path.extname(this.imagePath).toLowerCase();

        if (fileExt === '.png' || fileExt === '.jpg' || fileExt === '.jpeg') {
            await this.generateFromPNG();
        } else if (fileExt === '.svg') {
            await this.generateFromSVG();
        } else {
            throw new Error(`Unsupported file type: ${fileExt}`);
        }

        console.log('✅ Puzzle generation complete!');
        console.log(`📁 Output directory: ${this.outputDir}`);
    }

    async generateFromPNG() {
        console.log('🖼️ Processing PNG image...');

        // Load the original image
        const image = await loadImage(this.imagePath);
        const totalWidth = this.cols * this.pieceWidth;
        const totalHeight = this.rows * this.pieceHeight;

        // Create canvas for the original image
        const canvas = createCanvas(totalWidth, totalHeight);
        const ctx = canvas.getContext('2d');

        // Draw and scale image to fit the puzzle dimensions
        ctx.drawImage(image, 0, 0, totalWidth, totalHeight);

        const pieces = [];

        // Generate each piece
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const pieceIndex = row * this.cols + col;
                const piece = await this.createPNGPiece(ctx, col, row, pieceIndex);
                pieces.push(piece);
            }
        }

        // Generate puzzle.json
        this.generatePuzzleJSON(pieces);
    }

    async createPNGPiece(sourceCtx, col, row, index) {
        const x = col * this.pieceWidth;
        const y = row * this.pieceHeight;

        // Create canvas for this piece
        const canvas = createCanvas(this.pieceWidth, this.pieceHeight);
        const ctx = canvas.getContext('2d');

        // Create clipping path for puzzle piece shape with tabs
        ctx.save();

        // Start with a rectangle
        ctx.beginPath();
        ctx.rect(0, 0, this.pieceWidth, this.pieceHeight);

        // Add tabs and blanks based on position
        const hasTopTab = row > 0 && (index + row) % 2 === 0;
        const hasRightTab = col < this.cols - 1 && (index + col) % 2 === 1;
        const hasBottomTab = row < this.rows - 1 && (index + row) % 2 === 1;
        const hasLeftTab = col > 0 && (index + col) % 2 === 0;

        // Draw tabs (positive) or blanks (negative)
        if (hasTopTab) {
            this.drawTab(ctx, 'top', true);
        } else if (row > 0) {
            this.drawTab(ctx, 'top', false);
        }

        if (hasRightTab) {
            this.drawTab(ctx, 'right', true);
        } else if (col < this.cols - 1) {
            this.drawTab(ctx, 'right', false);
        }

        if (hasBottomTab) {
            this.drawTab(ctx, 'bottom', true);
        } else if (row < this.rows - 1) {
            this.drawTab(ctx, 'bottom', false);
        }

        if (hasLeftTab) {
            this.drawTab(ctx, 'left', true);
        } else if (col > 0) {
            this.drawTab(ctx, 'left', false);
        }

        ctx.clip();

        // Draw the portion of the source image
        ctx.drawImage(sourceCtx.canvas, x, y, this.pieceWidth, this.pieceHeight, 0, 0, this.pieceWidth, this.pieceHeight);

        ctx.restore();

        // Add border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Save as SVG for the puzzle app
        const svgContent = this.canvasToSVG(canvas, index);
        const filename = `piece${index + 1}.svg`;
        fs.writeFileSync(path.join(this.outputDir, filename), svgContent);

        return {
            file: filename,
            x: col * this.pieceWidth + this.pieceWidth / 2,
            y: row * this.pieceHeight + this.pieceHeight / 2
        };
    }

    drawTab(ctx, side, isTab) {
        const tabWidth = this.tabSize;
        const tabHeight = this.tabSize / 2;
        const centerX = this.pieceWidth / 2;
        const centerY = this.pieceHeight / 2;

        ctx.save();

        if (side === 'top') {
            const tabX = centerX;
            if (isTab) {
                ctx.moveTo(tabX - tabWidth/2, 0);
                ctx.quadraticCurveTo(tabX - tabWidth/2, -tabHeight, tabX, -tabHeight);
                ctx.quadraticCurveTo(tabX + tabWidth/2, -tabHeight, tabX + tabWidth/2, 0);
            } else {
                ctx.moveTo(tabX - tabWidth/2, 0);
                ctx.quadraticCurveTo(tabX - tabWidth/2, tabHeight, tabX, tabHeight);
                ctx.quadraticCurveTo(tabX + tabWidth/2, tabHeight, tabX + tabWidth/2, 0);
            }
        } else if (side === 'right') {
            const tabY = centerY;
            if (isTab) {
                ctx.moveTo(this.pieceWidth, tabY - tabWidth/2);
                ctx.quadraticCurveTo(this.pieceWidth + tabHeight, tabY - tabWidth/2, this.pieceWidth + tabHeight, tabY);
                ctx.quadraticCurveTo(this.pieceWidth + tabHeight, tabY + tabWidth/2, this.pieceWidth, tabY + tabWidth/2);
            } else {
                ctx.moveTo(this.pieceWidth, tabY - tabWidth/2);
                ctx.quadraticCurveTo(this.pieceWidth - tabHeight, tabY - tabWidth/2, this.pieceWidth - tabHeight, tabY);
                ctx.quadraticCurveTo(this.pieceWidth - tabHeight, tabY + tabWidth/2, this.pieceWidth, tabY + tabWidth/2);
            }
        } else if (side === 'bottom') {
            const tabX = centerX;
            if (isTab) {
                ctx.moveTo(tabX + tabWidth/2, this.pieceHeight);
                ctx.quadraticCurveTo(tabX + tabWidth/2, this.pieceHeight + tabHeight, tabX, this.pieceHeight + tabHeight);
                ctx.quadraticCurveTo(tabX - tabWidth/2, this.pieceHeight + tabHeight, tabX - tabWidth/2, this.pieceHeight);
            } else {
                ctx.moveTo(tabX + tabWidth/2, this.pieceHeight);
                ctx.quadraticCurveTo(tabX + tabWidth/2, this.pieceHeight - tabHeight, tabX, this.pieceHeight - tabHeight);
                ctx.quadraticCurveTo(tabX - tabWidth/2, this.pieceHeight - tabHeight, tabX - tabWidth/2, this.pieceHeight);
            }
        } else if (side === 'left') {
            const tabY = centerY;
            if (isTab) {
                ctx.moveTo(0, tabY + tabWidth/2);
                ctx.quadraticCurveTo(-tabHeight, tabY + tabWidth/2, -tabHeight, tabY);
                ctx.quadraticCurveTo(-tabHeight, tabY - tabWidth/2, 0, tabY - tabWidth/2);
            } else {
                ctx.moveTo(0, tabY + tabWidth/2);
                ctx.quadraticCurveTo(tabHeight, tabY + tabWidth/2, tabHeight, tabY);
                ctx.quadraticCurveTo(tabHeight, tabY - tabWidth/2, 0, tabY - tabWidth/2);
            }
        }

        ctx.restore();
    }

    canvasToSVG(canvas, index) {
        // Convert canvas content to SVG format
        // For simplicity, we'll extract the image data and embed it
        const dataURL = canvas.toDataURL();
        return `<svg width="${this.pieceWidth}" height="${this.pieceHeight}" viewBox="0 0 ${this.pieceWidth} ${this.pieceHeight}" xmlns="http://www.w3.org/2000/svg">
    <image href="${dataURL}" x="0" y="0" width="${this.pieceWidth}" height="${this.pieceHeight}"/>
    <text x="${this.pieceWidth/2}" y="${this.pieceHeight/2 + 8}" text-anchor="middle" font-size="20" fill="white" font-weight="bold" stroke="black" stroke-width="1">${index + 1}</text>
</svg>`;
    }

    async generateFromSVG() {
        console.log('🎨 Processing SVG image...');

        const svgContent = fs.readFileSync(this.imagePath, 'utf8');
        const pieces = [];

        // For SVG, we'll create path-based pieces with tabs
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const pieceIndex = row * this.cols + col;
                const piece = this.createSVGPiece(svgContent, col, row, pieceIndex);
                pieces.push(piece);
            }
        }

        this.generatePuzzleJSON(pieces);
    }

    createSVGPiece(sourceSVG, col, row, index) {
        const x = col * this.pieceWidth;
        const y = row * this.pieceHeight;

        // Create SVG piece with path-based tabs
        const path = this.generatePiecePath(col, row);
        const filename = `piece${index + 1}.svg`;

        const svgContent = `<svg width="${this.pieceWidth}" height="${this.pieceHeight}" viewBox="0 0 ${this.pieceWidth} ${this.pieceHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <clipPath id="clip${index}">
            <path d="${path}"/>
        </clipPath>
    </defs>
    <g clip-path="url(#clip${index})">
        <g transform="translate(${-x}, ${-y})">
            ${sourceSVG.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
        </g>
    </g>
    <path d="${path}" fill="none" stroke="#333" stroke-width="2"/>
    <text x="${this.pieceWidth/2}" y="${this.pieceHeight/2 + 8}" text-anchor="middle" font-size="20" fill="white" font-weight="bold" stroke="black" stroke-width="1">${index + 1}</text>
</svg>`;

        fs.writeFileSync(path.join(this.outputDir, filename), svgContent);

        return {
            file: filename,
            x: x + this.pieceWidth / 2,
            y: y + this.pieceHeight / 2
        };
    }

    generatePiecePath(col, row) {
        const index = row * this.cols + col;
        let path = `M 0 0`;

        const hasTopTab = row > 0 && (index + row) % 2 === 0;
        const hasRightTab = col < this.cols - 1 && (index + col) % 2 === 1;
        const hasBottomTab = row < this.rows - 1 && (index + row) % 2 === 1;
        const hasLeftTab = col > 0 && (index + col) % 2 === 0;

        // Top edge
        if (hasTopTab) {
            path += ` Q ${this.pieceWidth/2 - this.tabSize/2} ${-this.tabSize/2} ${this.pieceWidth/2} ${-this.tabSize/2}`;
            path += ` Q ${this.pieceWidth/2 + this.tabSize/2} ${-this.tabSize/2} ${this.pieceWidth} 0`;
        } else if (row > 0) {
            path += ` Q ${this.pieceWidth/2 - this.tabSize/2} ${this.tabSize/2} ${this.pieceWidth/2} ${this.tabSize/2}`;
            path += ` Q ${this.pieceWidth/2 + this.tabSize/2} ${this.tabSize/2} ${this.pieceWidth} 0`;
        } else {
            path += ` L ${this.pieceWidth} 0`;
        }

        // Right edge
        if (hasRightTab) {
            path += ` Q ${this.pieceWidth + this.tabSize/2} ${this.pieceHeight/2 - this.tabSize/2} ${this.pieceWidth + this.tabSize/2} ${this.pieceHeight/2}`;
            path += ` Q ${this.pieceWidth + this.tabSize/2} ${this.pieceHeight/2 + this.tabSize/2} ${this.pieceWidth} ${this.pieceHeight}`;
        } else if (col < this.cols - 1) {
            path += ` Q ${this.pieceWidth - this.tabSize/2} ${this.pieceHeight/2 - this.tabSize/2} ${this.pieceWidth - this.tabSize/2} ${this.pieceHeight/2}`;
            path += ` Q ${this.pieceWidth - this.tabSize/2} ${this.pieceHeight/2 + this.tabSize/2} ${this.pieceWidth} ${this.pieceHeight}`;
        } else {
            path += ` L ${this.pieceWidth} ${this.pieceHeight}`;
        }

        // Bottom edge
        if (hasBottomTab) {
            path += ` Q ${this.pieceWidth/2 + this.tabSize/2} ${this.pieceHeight + this.tabSize/2} ${this.pieceWidth/2} ${this.pieceHeight + this.tabSize/2}`;
            path += ` Q ${this.pieceWidth/2 - this.tabSize/2} ${this.pieceHeight + this.tabSize/2} 0 ${this.pieceHeight}`;
        } else if (row < this.rows - 1) {
            path += ` Q ${this.pieceWidth/2 + this.tabSize/2} ${this.pieceHeight - this.tabSize/2} ${this.pieceWidth/2} ${this.pieceHeight - this.tabSize/2}`;
            path += ` Q ${this.pieceWidth/2 - this.tabSize/2} ${this.pieceHeight - this.tabSize/2} 0 ${this.pieceHeight}`;
        } else {
            path += ` L 0 ${this.pieceHeight}`;
        }

        // Left edge
        if (hasLeftTab) {
            path += ` Q ${-this.tabSize/2} ${this.pieceHeight/2 + this.tabSize/2} ${-this.tabSize/2} ${this.pieceHeight/2}`;
            path += ` Q ${-this.tabSize/2} ${this.pieceHeight/2 - this.tabSize/2} 0 0`;
        } else if (col > 0) {
            path += ` Q ${this.tabSize/2} ${this.pieceHeight/2 + this.tabSize/2} ${this.tabSize/2} ${this.pieceHeight/2}`;
            path += ` Q ${this.tabSize/2} ${this.pieceHeight/2 - this.tabSize/2} 0 0`;
        } else {
            path += ` L 0 0`;
        }

        return path;
    }

    generatePuzzleJSON(pieces) {
        const puzzleData = pieces.map(piece => ({
            file: piece.file,
            x: piece.x,
            y: piece.y
        }));

        fs.writeFileSync(
            path.join(this.outputDir, 'puzzle.json'),
            JSON.stringify(puzzleData, null, 2)
        );

        console.log(`📄 Generated ${pieces.length} puzzle pieces`);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length !== 4) {
        console.log('Usage: node puzzle-generator.js <input-image> <columns> <rows> <output-dir>');
        console.log('Example: node puzzle-generator.js image.jpg 3 2 my-puzzle');
        process.exit(1);
    }

    const [imagePath, cols, rows, outputDir] = args;

    try {
        const generator = new PuzzleGenerator(
            imagePath,
            parseInt(cols),
            parseInt(rows),
            outputDir
        );

        generator.generate().catch(console.error);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

module.exports = PuzzleGenerator;