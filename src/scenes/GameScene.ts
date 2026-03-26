import Phaser from 'phaser';
import { SCENE_KEYS, MAP_SCALE, SCALED_TILE, EVENTS, INTERACTION_RADIUS } from '../constants';
import { Player } from '../entities/Player';
import { EventBus } from '../systems/EventBus';

interface InteractionZone {
  name: string;
  type: string;
  dialogueId: string;
  label: string;
  bounds: Phaser.Geom.Rectangle;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private interactionZones: InteractionZone[] = [];
  private activeZone: InteractionZone | null = null;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    // Create tilemap
    const map = this.make.tilemap({ key: 'town' });
    const tileset = map.addTilesetImage('terrain', 'terrain')!;

    // Create layers
    const groundLayer = map.createLayer('ground', tileset)!;
    groundLayer.setScale(MAP_SCALE);

    const pathsLayer = map.createLayer('paths', tileset)!;
    pathsLayer.setScale(MAP_SCALE);

    const buildingsLayer = map.createLayer('buildings', tileset)!;
    buildingsLayer.setScale(MAP_SCALE);

    const collisionsLayer = map.createLayer('collisions', tileset)!;
    collisionsLayer.setScale(MAP_SCALE);
    collisionsLayer.setVisible(false);
    collisionsLayer.setCollisionByExclusion([-1, 0]);

    // Find spawn point
    const spawnLayer = map.getObjectLayer('spawn');
    let spawnX = 15 * SCALED_TILE;
    let spawnY = 12 * SCALED_TILE;

    if (spawnLayer?.objects.length) {
      const spawnObj = spawnLayer.objects[0];
      spawnX = (spawnObj.x ?? spawnX) * MAP_SCALE;
      spawnY = (spawnObj.y ?? spawnY) * MAP_SCALE;
    }

    // Create player
    this.player = new Player(this, spawnX, spawnY);

    // Collision with walls
    this.physics.add.collider(this.player.sprite, collisionsLayer);

    // Parse interaction zones
    const interactionsLayer = map.getObjectLayer('interactions');
    if (interactionsLayer) {
      for (const obj of interactionsLayer.objects) {
        const props = this.parseProperties(obj.properties as Array<{ name: string; value: string }> | undefined);
        this.interactionZones.push({
          name: obj.name,
          type: props['type'] ?? 'generic',
          dialogueId: props['dialogueId'] ?? '',
          label: props['label'] ?? obj.name,
          bounds: new Phaser.Geom.Rectangle(
            (obj.x ?? 0) * MAP_SCALE,
            (obj.y ?? 0) * MAP_SCALE,
            (obj.width ?? 0) * MAP_SCALE,
            (obj.height ?? 0) * MAP_SCALE,
          ),
        });
      }
    }

    // Camera setup
    const mapWidthPx = map.widthInPixels * MAP_SCALE;
    const mapHeightPx = map.heightInPixels * MAP_SCALE;

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);
    this.physics.world.setBounds(0, 0, mapWidthPx, mapHeightPx);
    this.player.sprite.setCollideWorldBounds(true);

    // Launch UI scene on top
    this.scene.launch(SCENE_KEYS.UI);
  }

  update(): void {
    this.player.update();
    this.checkInteractions();
  }

  private checkInteractions(): void {
    const px = this.player.x;
    const py = this.player.y;

    let closestZone: InteractionZone | null = null;
    let closestDist = Infinity;

    for (const zone of this.interactionZones) {
      // Distance from player to the edge of the zone bounds
      const cx = zone.bounds.centerX;
      const cy = zone.bounds.centerY;
      const dist = Phaser.Math.Distance.Between(px, py, cx, cy);

      // Check if player is near the zone
      const expandedBounds = new Phaser.Geom.Rectangle(
        zone.bounds.x - INTERACTION_RADIUS,
        zone.bounds.y - INTERACTION_RADIUS,
        zone.bounds.width + INTERACTION_RADIUS * 2,
        zone.bounds.height + INTERACTION_RADIUS * 2,
      );

      if (expandedBounds.contains(px, py) && dist < closestDist) {
        closestDist = dist;
        closestZone = zone;
      }
    }

    if (closestZone && closestZone !== this.activeZone) {
      this.activeZone = closestZone;
      // Convert world position to screen position for the UI prompt
      EventBus.emit(EVENTS.INTERACTION_NEARBY, {
        screenX: this.cameras.main.width / 2,
        screenY: this.cameras.main.height / 2 - 40,
        zone: closestZone,
      });
    } else if (!closestZone && this.activeZone) {
      this.activeZone = null;
      EventBus.emit(EVENTS.INTERACTION_LEFT);
    }

    // Handle interaction trigger
    if (this.activeZone && this.player.isInteracting()) {
      EventBus.emit(EVENTS.INTERACTION_TRIGGERED, this.activeZone);
    }
  }

  private parseProperties(props?: Array<{ name: string; value: string }>): Record<string, string> {
    const result: Record<string, string> = {};
    if (props) {
      for (const p of props) {
        result[p.name] = p.value;
      }
    }
    return result;
  }
}
