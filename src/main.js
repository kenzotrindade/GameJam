import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: "app",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1200 },
      debug: true,
    },
  },
  scene: [GameScene],
};

new Phaser.Game(config);
