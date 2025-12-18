import { gameConfig } from "../constants.js";
import { Player } from "../entities/player.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.gameOver = false;
  }

  create() {
    this.gameOver = false;

    const graphics = this.make.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("square", 32, 32);
    graphics.destroy();

    const platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(400, 580, 800, 40, 0x666666);
    this.physics.add.existing(ground, true);
    platforms.add(ground);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysP2 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.player1 = new Player(this, 100, 400, "square", 0x3333ff);
    this.player2 = new Player(this, 700, 400, "square", 0xff3333);

    this.physics.add.collider(this.player1, platforms);
    this.physics.add.collider(this.player2, platforms);
    this.physics.add.collider(this.player1, this.player2);

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
      backgroundColor: "#00000088",
    });

    this.p1Surrender = this.add
      .text(80, 580, "P1 ABANDON", {
        fontSize: "18px",
        fill: "#fff",
        backgroundColor: "#ff0000",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandlerCursor: true })
      .on("pointerdown", () => {
        this.player1.hp = 0;
        this.checkWinner();
      });

    this.p2Surrender = this.add
      .text(780, 580, "P2 ABANDON", {
        fontSize: "18px",
        fill: "#fff",
        backgroundColor: "#ff0000",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandlerCursor: true })
      .on("pointerdown", () => {
        this.player2.hp = 0;
        this.checkWinner();
      });
  }

  update() {
    if (this.gameOver) return;

    if (this.player1) this.player1.update(this.cursors);
    if (this.player2) this.player2.update(this.keysP2);

    this.player1.updateFacing(this.player2);
    this.player2.updateFacing(this.player1);

    if (this.player1.hp <= 0 || this.player2.hp <= 0) {
      this.checkWinner();
    }

    this.debugText.setText([
      `P1 HP: ${this.player1.hp} | State: ${this.player1.state}`,
      `P2 HP: ${this.player2.hp} | State: ${this.player2.state}`,
      `Gravity: ${gameConfig.gravity}`,
    ]);
  }

  checkWinner() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.p1Surrender.setVisible(false);
    this.p2Surrender.setVisible(false);

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
