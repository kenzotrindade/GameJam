import Phaser from "phaser";
import { gameConfig } from "../constants.js";
import Player from "src/entities/player.js";

function walkStraight() {
  console.log("avance");
}

function crouch() {
  console.log("s'accroupit");
}

function walkBack() {
  console.log("recule");
}

function jump() {
  console.log("saute");
}

window.addEventListener("keydown", function (event) {
  switch (event.key) {
    case "ArrowUp":
      jump();
      break;

    case "ArrowDown":
      crouch();
      break;

    case "ArrowLeft":
      //if opponent is on the left of the player who enters ArrowLeft (to modified)      if (opponentPosition === "left") {
      if (opponentPosition === "left") {
        walkStraight();
      } else {
        walkBack();
      }
      break;

    case "ArrowRight":
      //if opponent is on the right of the player who enters ArrowRight (to modified)      if (opponentPosition === "right") {
      if (opponentPosition === "right") {
        walkStraight();
      } else {
        walkBack();
      }
      break;
  }
});
