import { gameConfig } from "../constants.js";
import { Player } from "../entities/player.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.gameOver = false;
    this.p1Score = 0;
    this.p2Score = 0;
    this.maxRounds = 3;
    this.needsWins = 2;
    this.isPaused = true;
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    let txt = this.add
      .text(width / 2, 200, "Choisissez le format", { fontSize: "32px" })
      .setOrigin(0.5);
    let btn3 = this.add
      .text(width / 2 - 100, 300, "[ BO3 ]", { fontSize: "40px", fill: "#0f0" })
      .setInteractive();
    let btn5 = this.add
      .text(width / 2 + 100, 300, "[ BO5 ]", { fontSize: "40px", fill: "#0f0" })
      .setInteractive();

    btn3.on("pointerdown", () => {
      this.setupMatch(3, txt, btn3, btn5);
    });
    btn5.on("pointerdown", () => {
      this.setupMatch(5, txt, btn3, btn5);
    });
    this.gameOver = false;

    const graphics = this.make.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("square", 32, 32);
    graphics.destroy();

    const platforms = this.physics.add.staticGroup();

    const ground = this.add.rectangle(
      width / 2,
      height - 20,
      width,
      40,
      0x666666
    );

    this.physics.add.existing(ground, true);
    ground.body.setSize(width, 40);
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

    this.physics.world.setBounds(0, 0, width, height);

    this.player1.setCollideWorldBounds(true);
    this.player2.setCollideWorldBounds(true);

    this.timeLeft = 99;
    this.timerText = this.add
      .text(400, 50, "99", { fontSize: "64px", fill: "#fff" })
      .setOrigin(0.5)
      .setVisible(false);

    this.debugText = this.add.text(10, 10, "", {
      fontSize: "16px",
      fill: "#00ff00",
      backgroundColor: "#00000088",
    });

    this.p1Surrender = this.add
      .text(80, 80, "P1 ABANDON", {
        fontSize: "18px",
        fill: "#fff",
        backgroundColor: "#ff0000",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.player1.hp = 0;
        this.checkWinner();
      });

    this.p2Surrender = this.add
      .text(300, 80, "P2 ABANDON", {
        fontSize: "18px",
        fill: "#fff",
        backgroundColor: "#ff0000",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(1, 0.5)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.player2.hp = 0;
        this.checkWinner();
      });
  }

  update() {
    if (this.gameOver) return;
    if (this.isPaused) return;

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
    if (this.timerEvent) this.timerEvent.remove();
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();

    let winner = this.player1.hp > this.player2.hp ? "P1" : "P2";
    if (winner === "P1") this.p1Score++;
    else this.p2Score++;

    this.p1Surrender.setVisible(false);
    this.p2Surrender.setVisible(false);

    if (this.p1Score >= this.needsWins || this.p2Score >= this.needsWins) {
      this.add
        .text(400, 300, `${winner} REMPORTE LE MATCH !`, {
          fontSize: "60px",
          fill: "#0f0",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      this.add
        .text(400, 400, "Appuyez sur R pour rejouer", { fontSize: "20px" })
        .setOrigin(0.5);

      this.input.keyboard.once("keydown-R", () => {
        this.scene.restart();
      });
    } else {
      let roundTxt = this.add
        .text(400, 200, `ROUND POUR ${winner}`, {
          fontSize: "40px",
          backgroundColor: "#000",
          padding: 10,
        })
        .setOrigin(0.5);

      this.time.delayedCall(2000, () => {
        roundTxt.destroy();
        this.startNewRound();
      });
    }
  }

  startNewRound() {
    this.physics.resume();
    this.gameOver = false;
    this.isPaused = true;
    this.timeLeft = 99;

    this.player1.setPosition(150, 450).clearTint().setTint(0x3333ff);
    this.player2.setPosition(650, 450).clearTint().setTint(0xff3333);
    this.player1.hp = gameConfig.maxHp;
    this.player2.hp = gameConfig.maxHp;

    let introText = this.add
      .text(400, 300, "", { fontSize: "80px", fontStyle: "bold" })
      .setOrigin(0.5);

    let steps = ["3", "2", "1", "FIGHT !"];

    steps.forEach((val, i) => {
      this.startTimer();
      this.time.delayedCall(i * 1000, () => {
        introText.setText(val);
        if (val === "FIGHT !") {
          this.isPaused = false;
          this.time.delayedCall(500, () => introText.destroy());
        }
      });
    });
  }

  setupMatch(rounds, t, b3, b5) {
    this.timerText.setVisible(true);
    this.p1Surrender.setVisible(true);
    this.p2Surrender.setVisible(true);
    this.maxRounds = rounds;
    this.needsWins = Math.ceil(rounds / 2);
    t.destroy();
    b3.destroy();
    b5.destroy();
    this.startNewRound();
  }

  startTimer() {
    this.timerEvent = this.time.addEvent({
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
  }
}
