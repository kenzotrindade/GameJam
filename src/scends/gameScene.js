import { gameConfig } from "../constants.js";
import Player from "../entities/player.js";

export default class gameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.gameOver = false;
  }

  create() {
    this.gameOver = false;

    this.player1 = new Player(this, 200, 450, "playerRed", 0xff0000);
    this.player2 = new Player(this, 600, 450, "playerBlue", 0x0000ff);

    this.timeLeft = 99;
    this.timerText = this.add
      .text(400, 50, "99", { fontSize: "64px", fill: "#fff" })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.timeLeft > 0 && !this.gameOver) {
          this.timeLeft--;
          this.timerText.setText(this.timeLeft);
        } else if (this.timeLeft === 0) {
          this.checkWinner();
        }
      },
      callbackScope: this,
      loop: true,
    });

    this.debugText = this.add.text(10, 10, "", {
      fontSize: "16px",
      fill: "#00ff00",
      backgroundColor: "#000088",
    });
  }

  update() {
    if (this.gameOver) return;

    if (this.player1.hp <= 0 || this.player2.hp <= 0) {
      this.checkWinner();
    }

    this.player1.updateFacing(this.player2);
    this.player2.updateFacing(this.player1);

    this.debugText.setText([
      `P1 HP: ${this.player1.hp} | State: ${this.player1.state}`,
      `P2 HP: ${this.player2.hp} | State: ${this.player2.state}`,
      `Gravity: ${gameConfig.gravity}`,
    ]);
  }

  checkWinner() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();

    let winnerText = "";
    if (this.player1.hp > this.player2.hp) winnerText = "P1 GAGNE !";
    else if (this.player2.hp > this.player1.hp) winnerText = "P2 GAGNE !";
    else winnerText = "MATCH NUL";

    this.add
      .text(400, 300, winnerText, { fontSize: "80px", fill: "#f00" })
      .setOrigin(0.5);
    this.add
      .text(400, 400, "Appuyez sur R pour rejouer", { fontSize: "20px" })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-R", () => {
      this.scene.restart();
    });
  }
}
