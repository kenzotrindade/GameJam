import Phaser from "phaser";

// import { GameScene } from './scenes/GameScene';

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
  scene: {
    preload: preload,
    create: create,
  },
};

function preload() {
  this.load.image("sky", "https://labs.phaser.io/assets/skies/space3.png");
}

function create() {
  this.add.image(640, 360, "sky");
  this.add.text(10, 10, "Mode Combat : Initialisé", { fill: "#0f0" });
}

new Phaser.Game(config);
