import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

// Variables pour stocker les choix (Ton Back JS simple)
let p1Choice = "red"; // Valeur par défaut
let p2Choice = "emerald";

// --- FONCTIONS GLOBALES (Pour que le HTML puisse les voir) ---
window.selectP1 = (choice) => {
  p1Choice = choice;
  console.log("P1 choisi:", choice);
};

window.selectP2 = (choice) => {
  p2Choice = choice;
  console.log("P2 choisi:", choice);
};

window.startGame = () => {
  // 1. On cache le menu HTML
  document.getElementById("html-menu-overlay").classList.add("hidden");

  // 2. On lance Phaser SEULEMENT MAINTENANT
  launchPhaser(p1Choice, p2Choice);
};

// --- LANCEMENT DE PHASER ---
function launchPhaser(p1, p2) {
  const config = {
    type: Phaser.AUTO,
    parent: "app",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 3000 }, debug: false },
    },
    // On passe les données à la scène via le callbacks
    callbacks: {
      preBoot: (game) => {
        // LE VOILA LE REGISTRY !
        // On injecte les données direct dans le cerveau de Phaser
        game.registry.set("p1", p1);
        game.registry.set("p2", p2);
      },
    },
    scene: [GameScene],
  };

  new Phaser.Game(config);
}
