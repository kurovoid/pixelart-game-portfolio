import sharp from 'sharp';
import { writeFileSync } from 'fs';

const TILE = 16;

// Generate a simple terrain tileset: 4 tiles in a row
// Tile 0: Grass (green), Tile 1: Path (sandy), Tile 2: Wall (dark), Tile 3: Water (blue)
async function generateTerrain() {
  const width = TILE * 4;
  const height = TILE;

  const pixels = Buffer.alloc(width * height * 4);

  const colors = [
    [74, 140, 58, 255],    // grass
    [194, 178, 128, 255],  // path
    [80, 70, 80, 255],     // wall
    [60, 100, 180, 255],   // water
  ];

  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const tileIndex = Math.floor(tx / TILE);
      const color = colors[tileIndex];
      const idx = (ty * width + tx) * 4;
      // Add slight pixel-art noise for texture
      const noise = ((tx + ty) % 3 === 0) ? -10 : ((tx * ty) % 5 === 0) ? 8 : 0;
      pixels[idx] = Math.max(0, Math.min(255, color[0] + noise));
      pixels[idx + 1] = Math.max(0, Math.min(255, color[1] + noise));
      pixels[idx + 2] = Math.max(0, Math.min(255, color[2] + noise));
      pixels[idx + 3] = color[3];
    }
  }

  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/assets/tilemaps/tilesets/terrain.png');

  console.log('Generated terrain.png');
}

// Generate a player spritesheet: 4 rows (down, left, right, up) x 4 frames each
async function generatePlayer() {
  const fw = TILE;
  const fh = TILE;
  const cols = 4;
  const rows = 4;
  const width = fw * cols;
  const height = fh * rows;

  const pixels = Buffer.alloc(width * height * 4);

  // Simple character: body color + head
  const bodyColor = [65, 105, 225, 255]; // royal blue
  const skinColor = [255, 200, 150, 255]; // skin
  const hairColor = [60, 40, 30, 255]; // dark brown

  // For each direction and frame, draw a simple character
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      drawCharacter(pixels, width, col * fw, row * fh, fw, fh, row, col, bodyColor, skinColor, hairColor);
    }
  }

  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/assets/sprites/player/player.png');

  console.log('Generated player.png');
}

function setPixel(buf, width, x, y, color) {
  const idx = (y * width + x) * 4;
  buf[idx] = color[0];
  buf[idx + 1] = color[1];
  buf[idx + 2] = color[2];
  buf[idx + 3] = color[3];
}

function fillRect(buf, width, rx, ry, rw, rh, color) {
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      setPixel(buf, width, x, y, color);
    }
  }
}

function drawCharacter(buf, totalWidth, ox, oy, fw, fh, direction, frame, body, skin, hair) {
  // Walk animation: shift legs based on frame
  const legOffset = (frame % 2 === 0) ? 0 : 1;

  // Head (4x4 at top center)
  fillRect(buf, totalWidth, ox + 6, oy + 1, 4, 4, skin);

  // Hair on top
  fillRect(buf, totalWidth, ox + 6, oy + 0, 4, 2, hair);

  // Eyes (direction-dependent)
  if (direction === 0) { // down - facing camera
    setPixel(buf, totalWidth, ox + 7, oy + 3, [30, 30, 30, 255]);
    setPixel(buf, totalWidth, ox + 9, oy + 3, [30, 30, 30, 255]);
  } else if (direction === 3) { // up - back of head
    // no eyes visible
  } else if (direction === 1) { // left
    setPixel(buf, totalWidth, ox + 6, oy + 3, [30, 30, 30, 255]);
  } else { // right
    setPixel(buf, totalWidth, ox + 9, oy + 3, [30, 30, 30, 255]);
  }

  // Body (6x5)
  fillRect(buf, totalWidth, ox + 5, oy + 5, 6, 5, body);

  // Legs (walk animation)
  const legColor = [50, 50, 120, 255]; // dark blue pants
  if (legOffset === 0) {
    fillRect(buf, totalWidth, ox + 5, oy + 10, 2, 4, legColor);
    fillRect(buf, totalWidth, ox + 9, oy + 10, 2, 4, legColor);
  } else {
    fillRect(buf, totalWidth, ox + 6, oy + 10, 2, 4, legColor);
    fillRect(buf, totalWidth, ox + 8, oy + 10, 2, 4, legColor);
  }

  // Feet
  const shoeColor = [100, 60, 30, 255];
  if (legOffset === 0) {
    fillRect(buf, totalWidth, ox + 5, oy + 14, 2, 2, shoeColor);
    fillRect(buf, totalWidth, ox + 9, oy + 14, 2, 2, shoeColor);
  } else {
    fillRect(buf, totalWidth, ox + 6, oy + 14, 2, 2, shoeColor);
    fillRect(buf, totalWidth, ox + 8, oy + 14, 2, 2, shoeColor);
  }
}

// Generate a small Tiled-compatible town map (30x25 tiles)
function generateTilemap() {
  const mapW = 30;
  const mapH = 25;

  // Layer data: 0 = empty, 1 = grass, 2 = path, 3 = wall, 4 = water
  // Tiled uses 1-based tile IDs (0 = no tile)

  // Ground layer: all grass
  const ground = Array(mapW * mapH).fill(1);

  // Add paths
  const paths = Array(mapW * mapH).fill(0);
  // Horizontal main path
  for (let x = 3; x < 27; x++) {
    paths[12 * mapW + x] = 2;
    paths[13 * mapW + x] = 2;
  }
  // Vertical path
  for (let y = 3; y < 22; y++) {
    paths[y * mapW + 14] = 2;
    paths[y * mapW + 15] = 2;
  }

  // Buildings layer (walls)
  const buildings = Array(mapW * mapH).fill(0);

  // Office building (top-left area)
  const addBuilding = (bx, by, bw, bh) => {
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + bw; x++) {
        buildings[y * mapW + x] = 3;
      }
    }
  };

  addBuilding(3, 3, 5, 4);    // Office (About Me)
  addBuilding(20, 3, 6, 4);   // Workshop (Projects)
  addBuilding(3, 17, 5, 4);   // Library (Skills)
  addBuilding(20, 17, 6, 4);  // Post Office (Contact)

  // Collision layer (same as buildings + map border)
  const collisions = Array(mapW * mapH).fill(0);
  // Copy buildings to collisions
  for (let i = 0; i < buildings.length; i++) {
    if (buildings[i] !== 0) collisions[i] = 3;
  }
  // Add border walls
  for (let x = 0; x < mapW; x++) {
    collisions[x] = 3;                          // top
    collisions[(mapH - 1) * mapW + x] = 3;      // bottom
  }
  for (let y = 0; y < mapH; y++) {
    collisions[y * mapW] = 3;                    // left
    collisions[y * mapW + (mapW - 1)] = 3;       // right
  }

  // Water features (small pond)
  for (let y = 8; y < 11; y++) {
    for (let x = 24; x < 28; x++) {
      ground[y * mapW + x] = 4;
      collisions[y * mapW + x] = 3;
    }
  }

  const tilemap = {
    compressionlevel: -1,
    height: mapH,
    infinite: false,
    layers: [
      {
        data: ground,
        height: mapH,
        id: 1,
        name: "ground",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: mapW,
        x: 0,
        y: 0,
      },
      {
        data: paths,
        height: mapH,
        id: 2,
        name: "paths",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: mapW,
        x: 0,
        y: 0,
      },
      {
        data: buildings,
        height: mapH,
        id: 3,
        name: "buildings",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: mapW,
        x: 0,
        y: 0,
      },
      {
        data: collisions,
        height: mapH,
        id: 4,
        name: "collisions",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: mapW,
        x: 0,
        y: 0,
      },
      {
        draworder: "topdown",
        id: 5,
        name: "spawn",
        objects: [
          {
            height: 0,
            id: 1,
            name: "spawn",
            rotation: 0,
            type: "spawn",
            visible: true,
            width: 0,
            x: 15 * TILE,
            y: 12 * TILE,
          },
        ],
        opacity: 1,
        type: "objectgroup",
        visible: true,
        x: 0,
        y: 0,
      },
      {
        draworder: "topdown",
        id: 6,
        name: "interactions",
        objects: [
          {
            height: 4 * TILE,
            id: 10,
            name: "office",
            properties: [
              { name: "type", type: "string", value: "about" },
              { name: "dialogueId", type: "string", value: "about-me" },
              { name: "label", type: "string", value: "Office" },
            ],
            rotation: 0,
            type: "interaction",
            visible: true,
            width: 5 * TILE,
            x: 3 * TILE,
            y: 3 * TILE,
          },
          {
            height: 4 * TILE,
            id: 11,
            name: "workshop",
            properties: [
              { name: "type", type: "string", value: "projects" },
              { name: "dialogueId", type: "string", value: "projects" },
              { name: "label", type: "string", value: "Workshop" },
            ],
            rotation: 0,
            type: "interaction",
            visible: true,
            width: 6 * TILE,
            x: 20 * TILE,
            y: 3 * TILE,
          },
          {
            height: 4 * TILE,
            id: 12,
            name: "library",
            properties: [
              { name: "type", type: "string", value: "skills" },
              { name: "dialogueId", type: "string", value: "skills" },
              { name: "label", type: "string", value: "Library" },
            ],
            rotation: 0,
            type: "interaction",
            visible: true,
            width: 5 * TILE,
            x: 3 * TILE,
            y: 17 * TILE,
          },
          {
            height: 4 * TILE,
            id: 13,
            name: "postoffice",
            properties: [
              { name: "type", type: "string", value: "contact" },
              { name: "dialogueId", type: "string", value: "contact" },
              { name: "label", type: "string", value: "Post Office" },
            ],
            rotation: 0,
            type: "interaction",
            visible: true,
            width: 6 * TILE,
            x: 20 * TILE,
            y: 17 * TILE,
          },
        ],
        opacity: 1,
        type: "objectgroup",
        visible: true,
        x: 0,
        y: 0,
      },
      {
        draworder: "topdown",
        id: 7,
        name: "locations",
        objects: [
          {
            height: mapH * TILE,
            id: 20,
            name: "Town Square",
            rotation: 0,
            type: "location",
            visible: true,
            width: mapW * TILE,
            x: 0,
            y: 0,
          },
        ],
        opacity: 1,
        type: "objectgroup",
        visible: true,
        x: 0,
        y: 0,
      },
    ],
    nextlayerid: 8,
    nextobjectid: 30,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.10.2",
    tileheight: TILE,
    tilesets: [
      {
        columns: 4,
        firstgid: 1,
        image: "../tilesets/terrain.png",
        imageheight: TILE,
        imagewidth: TILE * 4,
        margin: 0,
        name: "terrain",
        spacing: 0,
        tilecount: 4,
        tileheight: TILE,
        tilewidth: TILE,
      },
    ],
    tilewidth: TILE,
    type: "map",
    version: "1.10",
    width: mapW,
  };

  writeFileSync('public/assets/tilemaps/town.json', JSON.stringify(tilemap, null, 2));
  console.log('Generated town.json');
}

await generateTerrain();
await generatePlayer();
generateTilemap();
console.log('All placeholder assets generated!');
