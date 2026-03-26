import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    // Nothing to preload in boot — we generate the progress bar graphics
  }

  create(): void {
    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}
