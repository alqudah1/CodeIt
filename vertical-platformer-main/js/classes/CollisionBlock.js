class CollisionBlock {
  constructor({ position, height = 16, lesson, url, level, platformId }) {
    this.position = position;
    this.width = 16;
    this.height = height;
    this.lesson = lesson || null;
    this.url = url || null;
    this.level = level || null;
    this.platformId = platformId || null;
    this.visited = false;
    this.isFirstBlock = true; // Used to determine where to draw the label
  }

  draw() {
    // Check if any block in this platform (same platformId) has been visited
    const platformBlocks = platformCollisionBlocks.filter(block => block.platformId === this.platformId);
    const isVisited = platformBlocks.some(block => block.visited);
    c.fillStyle = isVisited ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    c.fillRect(this.position.x, this.position.y, this.width, this.height);

    // Draw the level label on the first block of the platform
    if (this.level && this.isFirstBlock) {
      // Calculate the total width of the platform (all blocks with the same platformId)
      const platformWidth = platformBlocks.length * this.width;
      const labelText = `L${this.level}`;
      
      // Set up the label style
      c.font = '12px Arial';
      c.textAlign = 'center';
      c.textBaseline = 'middle';

      // Calculate the center of the platform
      const platformStartX = platformBlocks[0].position.x;
      const labelX = platformStartX + platformWidth / 2;
      const labelY = this.position.y + this.height / 2;

      // Draw a background rectangle for the label
      const textMetrics = c.measureText(labelText);
      const textWidth = textMetrics.width + 8; // Add padding
      const textHeight = 16; // Approximate height with padding
      c.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black background
      c.fillRect(labelX - textWidth / 2, labelY - textHeight / 2, textWidth, textHeight);

      // Draw the label with a colorful gradient
      const gradient = c.createLinearGradient(labelX - textWidth / 2, labelY, labelX + textWidth / 2, labelY);
      gradient.addColorStop(0, 'cyan');
      gradient.addColorStop(1, 'magenta');
      c.fillStyle = gradient;
      c.fillText(labelText, labelX, labelY);
    }
  }

  update() {
    this.draw();
  }
}