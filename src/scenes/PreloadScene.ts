import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  preload(): void {
    this.createProgressBar();
    this.loadAssets();
  }

  private createProgressBar(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const barWidth = 300;
    const barHeight = 20;

    // Background bar
    const bgBar = this.add.rectangle(centerX, centerY, barWidth, barHeight, 0x333333);
    bgBar.setStrokeStyle(2, 0x888888);

    // Fill bar
    const fillBar = this.add.rectangle(
      centerX - barWidth / 2 + 2,
      centerY,
      0,
      barHeight - 4,
      0x4ade80,
    );
    fillBar.setOrigin(0, 0.5);

    // Loading text
    const loadingText = this.add.text(centerX, centerY - 30, 'Loading...', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    loadingText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fillBar.width = (barWidth - 4) * value;
    });

    this.load.on('complete', () => {
      loadingText.setText('Ready!');
    });
  }

  private loadAssets(): void {
    // Tilemap
    this.load.tilemapTiledJSON('town', '/assets/tilemaps/town.json');
    this.load.image('terrain', '/assets/tilemaps/tilesets/terrain.png');

    // Player spritesheet
    this.load.spritesheet('player', '/assets/sprites/player/player.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create(): void {
    this.createAnimations();
    this.scene.start(SCENE_KEYS.GAME);
  }

  private createAnimations(): void {
    // Player walk animations (4 frames per direction)
    const directions = ['down', 'left', 'right', 'up'] as const;

    directions.forEach((dir, rowIndex) => {
      this.anims.create({
        key: `player-walk-${dir}`,
        frames: this.anims.generateFrameNumbers('player', {
          start: rowIndex * 4,
          end: rowIndex * 4 + 3,
        }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: `player-idle-${dir}`,
        frames: [{ key: 'player', frame: rowIndex * 4 }],
        frameRate: 1,
      });
    });
  }
}
