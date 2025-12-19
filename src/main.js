import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  pixelArt: true,
  backgroundColor: "#000000",

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },

  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 3000 },
      debug: true,
    },
  },
  scene: [GameScene],
};

new Phaser.Game(config);
