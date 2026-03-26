export const TILE_SIZE = 16;
export const MAP_SCALE = 2;
export const SCALED_TILE = TILE_SIZE * MAP_SCALE;

export const PLAYER_SPEED = 120;
export const PLAYER_FRAME_RATE = 8;

export const INTERACTION_RADIUS = SCALED_TILE * 1.5;

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  UI: 'UIScene',
} as const;

export const EVENTS = {
  INTERACTION_NEARBY: 'interaction:nearby',
  INTERACTION_LEFT: 'interaction:left',
  INTERACTION_TRIGGERED: 'interaction:triggered',
  DIALOGUE_START: 'dialogue:start',
  DIALOGUE_END: 'dialogue:end',
  LOCATION_CHANGED: 'location:changed',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
} as const;

export const DEPTH = {
  GROUND: 0,
  DECORATIONS: 1,
  ENTITIES: 2,
  FOREGROUND: 3,
} as const;
