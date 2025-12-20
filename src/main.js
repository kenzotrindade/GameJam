import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

export const startGame = (p1Skin, p2Skin) => {
  const config = {
    type: Phaser.AUTO,
    parent: "app",
    pixelArt: true,
    roundPixels: true,

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },

    input: {
      gamepad: true,
    },

    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 3000 },
        debug: true,
      },
    },

    callbacks: {
      preBoot: (game) => {
        game.registry.set("p1_skin", p1Skin);
        game.registry.set("p2_skin", p2Skin);
        console.log("Phaser démarre avec :", p1Skin, "VS", p2Skin);
      },
    },

    scene: [GameScene],
  };

  new Phaser.Game(config);
};
