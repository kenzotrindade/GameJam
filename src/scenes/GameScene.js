import { gameConfig } from "../constants.js";
import { Player } from "../entities/player.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.p1Score = 0;
    this.p2Score = 0;
    this.maxRounds = 3;
    this.needsWins = 2;
    this.isPaused = true;
    this.gameOver = false;
    this.timerEvent = null;
  }

  preload() {
    this.load.image("samurai_p1", "img/samourai.png");
    this.load.image("samurai_p2", "img/samourai2.png");
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    const platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(
      width / 2,
      height - 20,
      width,
      40,
      0x666666
    );
    this.physics.add.existing(ground, true);
    platforms.add(ground);

    this.player1 = new Player(this, 250, height - 40, "samurai_p1", 0xff3333);
    this.player2 = new Player(
      this,
      width - 250,
      height - 40,
      "samurai_p2",
      0x3333ff
    );

    this.physics.add.collider(this.player1, platforms);
    this.physics.add.collider(this.player2, platforms);
    this.physics.add.collider(this.player1, this.player2);

    this.keysP1 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      lowattack: Phaser.Input.Keyboard.KeyCodes.C,
      midattack: Phaser.Input.Keyboard.KeyCodes.X,
      heavyattack: Phaser.Input.Keyboard.KeyCodes.W,
    });

    this.keysP2 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      lowattack: Phaser.Input.Keyboard.KeyCodes.U,
      midattack: Phaser.Input.Keyboard.KeyCodes.I,
      heavyattack: Phaser.Input.Keyboard.KeyCodes.O,
    });

    this.timerText = this.add
      .text(width / 2, 50, "99", {
        fontSize: "64px",
        fill: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.add
      .rectangle(width * 0.3, 50, 305, 35, 0x000000, 0.5)
      .setOrigin(1, 0.5);
    this.healthBar1 = this.add
      .rectangle(width * 0.3, 50, 300, 30, 0xffff00)
      .setOrigin(1, 0.5)
      .setVisible(false);

    this.add
      .rectangle(width * 0.7, 50, 305, 35, 0x000000, 0.5)
      .setOrigin(0, 0.5);
    this.healthBar2 = this.add
      .rectangle(width * 0.7, 50, 300, 30, 0xffff00)
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.p1Surrender = this.add
      .text(width * 0.3 - 300, 80, "ABANDON [P1]", {
        backgroundColor: "#900",
        padding: 5,
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.handleManualWin("P2"))
      .setVisible(false);

    this.p2Surrender = this.add
      .text(width * 0.7 + 300, 80, "ABANDON [P2]", {
        backgroundColor: "#900",
        padding: 5,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.handleManualWin("P1"))
      .setVisible(false);

    this.debugText = this.add.text(10, height - 30, "", {
      fontSize: "14px",
      fill: "#0f0",
    });

    this.showMenu();
  }

  showMenu() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    let txt = this.add
      .text(centerX, centerY - 100, "CHOISISSEZ LE FORMAT", {
        fontSize: "42px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const btnStyle = {
      fontSize: "32px",
      fill: "#fff",
      backgroundColor: "#900",
      padding: { x: 20, y: 10 },
      fixedWidth: 200,
    };

    let btn3 = this.add
      .text(centerX - 120, centerY, "BO3", btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlign("center");
    let btn5 = this.add
      .text(centerX + 120, centerY, "BO5", btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlign("center");

    btn3.on("pointerdown", () => this.setupMatch(3, txt, btn3, btn5));
    btn5.on("pointerdown", () => this.setupMatch(5, txt, btn3, btn5));
  }

  setupMatch(rounds, t, b3, b5) {
    this.maxRounds = rounds;
    this.needsWins = Math.ceil(rounds / 2);
    t.destroy();
    b3.destroy();
    b5.destroy();
    this.healthBar1.setVisible(true);
    this.healthBar2.setVisible(true);
    this.timerText.setVisible(true);
    this.p1Surrender.setVisible(true);
    this.p2Surrender.setVisible(true);
    this.startNewRound();
  }

  startNewRound() {
    this.physics.resume();
    this.gameOver = false;
    this.isPaused = true;
    this.timeLeft = 99;
    this.timerText.setText("99").setColor("#fff");
    this.player1.setPosition(250, 500).clearTint();
    this.player2.setPosition(this.scale.width - 250, 500).clearTint();
    this.player1.hp = gameConfig.maxHp;
    this.player2.hp = gameConfig.maxHp;

    let introText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "", {
        fontSize: "80px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    let steps = ["3", "2", "1", "FIGHT !"];
    steps.forEach((val, i) => {
      this.time.delayedCall(i * 1000, () => {
        introText.setText(val);
        if (val === "FIGHT !") {
          this.isPaused = false;
          this.time.delayedCall(500, () => introText.destroy());
          this.startTimer();
        }
      });
    });
  }

  startTimer() {
    if (this.timerEvent) this.timerEvent.remove();
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
      loop: true,
    });
  }

  update() {
    if (this.gameOver || this.isPaused) return;
    this.player1.update(this.keysP1, this.player2);
    this.player2.update(this.keysP2, this.player1);
    this.player1.updateFacing(this.player2);
    this.player2.updateFacing(this.player1);

    this.healthBar1.width = (this.player1.hp / gameConfig.maxHp) * 300;
    this.healthBar2.width = (this.player2.hp / gameConfig.maxHp) * 300;

    if (this.player1.hp <= 0 || this.player2.hp <= 0) this.checkWinner();
  }

  handleManualWin(winner) {
    if (winner === "P1") this.player2.hp = 0;
    else this.player1.hp = 0;
    this.checkWinner();
  }

  checkWinner() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    let winner =
      this.player1.hp > this.player2.hp
        ? "P1"
        : this.player2.hp > this.player1.hp
        ? "P2"
        : "DRAW";
    if (winner === "P1") this.p1Score++;
    else if (winner === "P2") this.p2Score++;
    if (this.p1Score >= this.needsWins || this.p2Score >= this.needsWins)
      this.displayFinalVictory(winner);
    else this.displayRoundVictory(winner);
  }

  displayRoundVictory(winner) {
    let roundTxt = this.add
      .text(this.scale.width / 2, 200, `ROUND POUR ${winner}`, {
        fontSize: "40px",
        backgroundColor: "#000",
        padding: 15,
      })
      .setOrigin(0.5);
    this.time.delayedCall(2000, () => {
      roundTxt.destroy();
      this.startNewRound();
    });
  }

  displayFinalVictory(winner) {
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7
    );
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 50,
        `${winner} GAGNE !`,
        { fontSize: "60px", fill: "#0f0" }
      )
      .setOrigin(0.5);
    this.input.keyboard.once("keydown-R", () => {
      this.p1Score = 0;
      this.p2Score = 0;
      this.scene.restart();
    });
  }
}
