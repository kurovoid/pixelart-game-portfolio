import Phaser from 'phaser';
import { SCENE_KEYS, EVENTS } from '../constants';
import { EventBus } from '../systems/EventBus';

export class UIScene extends Phaser.Scene {
  private interactPrompt!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.UI);
  }

  create(): void {
    this.interactPrompt = this.add.text(0, 0, 'Press E to interact', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 6, y: 4 },
      fontFamily: 'monospace',
    });
    this.interactPrompt.setOrigin(0.5, 1);
    this.interactPrompt.setVisible(false);

    EventBus.on(EVENTS.INTERACTION_NEARBY, this.showPrompt, this);
    EventBus.on(EVENTS.INTERACTION_LEFT, this.hidePrompt, this);
  }

  private showPrompt(data: { screenX: number; screenY: number }): void {
    this.interactPrompt.setPosition(data.screenX, data.screenY - 10);
    this.interactPrompt.setVisible(true);
  }

  private hidePrompt(): void {
    this.interactPrompt.setVisible(false);
  }

  shutdown(): void {
    EventBus.off(EVENTS.INTERACTION_NEARBY, this.showPrompt, this);
    EventBus.off(EVENTS.INTERACTION_LEFT, this.hidePrompt, this);
  }
}
