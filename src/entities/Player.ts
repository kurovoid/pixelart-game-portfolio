import Phaser from 'phaser';
import { PLAYER_SPEED, MAP_SCALE } from '../constants';

type Direction = 'up' | 'down' | 'left' | 'right';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private facing: Direction = 'down';
  private inputEnabled = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'player', 0);
    this.sprite.setScale(MAP_SCALE);
    this.sprite.setSize(12, 12);
    this.sprite.setOffset(2, 4);

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get direction(): Direction {
    return this.facing;
  }

  setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
  }

  isInteracting(): boolean {
    return this.inputEnabled && Phaser.Input.Keyboard.JustDown(this.interactKey);
  }

  update(): void {
    if (!this.inputEnabled) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    const up = this.cursors.up?.isDown || this.wasd.W?.isDown;
    const down = this.cursors.down?.isDown || this.wasd.S?.isDown;
    const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D?.isDown;

    let vx = 0;
    let vy = 0;

    if (left) vx = -1;
    else if (right) vx = 1;

    if (up) vy = -1;
    else if (down) vy = 1;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2;
      vx *= factor;
      vy *= factor;
    }

    this.sprite.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);

    // Determine facing direction and play animation
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vy) >= Math.abs(vx)) {
        this.facing = vy < 0 ? 'up' : 'down';
      } else {
        this.facing = vx < 0 ? 'left' : 'right';
      }
      this.sprite.anims.play(`player-walk-${this.facing}`, true);
    } else {
      this.sprite.anims.play(`player-idle-${this.facing}`, true);
    }
  }
}
