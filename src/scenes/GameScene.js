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

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    const graphics = this.make.graphics();
    graphics.fillStyle(0xffffff, 1).fillRect(0, 0, 32, 32);
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

    this.player1 = new Player(this, 150, 450, "square", 0x3333ff);
    this.player2 = new Player(this, 650, 450, "square", 0xff3333);

    this.heatlhBar1 = this.add
      .rectangle(100, 30, 200, 20, 0xffff00)
      .setOrigin(0, 0.5);
    this.heatlhBar2 = this.add
      .rectangle(550, 30, 200, 20, 0xffff00)
      .setOrigin(0, 0.5);

    this.physics.add.collider(this.player1, platforms);
    this.physics.add.collider(this.player2, platforms);
    this.physics.add.collider(this.player1, this.player2);

    this.physics.world.setBounds(0, 0, width, height);
    this.player1.setCollideWorldBounds(true);
    this.player2.setCollideWorldBounds(true);

    this.keysP1 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.keysP2 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      attack: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });

    this.healthBar1 = this.add
      .rectangle(100, 30, 200, 20, 0xffff00)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.healthBar2 = this.add
      .rectangle(width - 100, 30, 200, 20, 0xffff00)
      .setOrigin(1, 0.5)
      .setVisible(false);

    this.timerText = this.add
      .text(width / 2, 50, "99", { fontSize: "64px", fill: "#fff" })
      .setOrigin(0.5)
      .setVisible(false);
    this.debugText = this.add.text(10, 10, "", {
      fontSize: "16px",
      fill: "#0f0",
      backgroundColor: "#00000088",
    });

    this.p1Surrender = this.add
      .text(80, 80, "P1 ABANDON", { backgroundColor: "#f00", padding: 5 })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.handleManualWin("P2");
      })
      .setVisible(false);

    this.p2Surrender = this.add
      .text(width - 80, 80, "P2 ABANDON", {
        backgroundColor: "#f00",
        padding: 5,
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.handleManualWin("P1");
      })
      .setVisible(false);

    this.showMenu();
  }

  showMenu() {
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

    this.player1.setPosition(150, 450).clearTint().setTint(0x3333ff);
    this.player2.setPosition(650, 450).clearTint().setTint(0xff3333);
    this.player1.hp = gameConfig.maxHp;
    this.player2.hp = gameConfig.maxHp;
    this.player1.state = "IDLE";
    this.player2.state = "IDLE";

    let introText = this.add
      .text(400, 300, "", { fontSize: "80px", fontStyle: "bold" })
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
          if (this.timeLeft <= 10) this.timerText.setColor("#f00");
        } else if (this.timeLeft === 0) {
          this.checkWinner();
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  update() {
    if (this.gameOver || this.isPaused) return;

    this.player1.update(this.keysP1, this.player2);
    this.player2.update(this.keysP2, this.player1);

    this.player1.updateFacing(this.player2);
    this.player2.updateFacing(this.player1);

    this.healthBar1.width = (this.player1.hp / gameConfig.maxHp) * 200;
    this.healthBar2.width = (this.player2.hp / gameConfig.maxHp) * 200;

    if (this.player1.hp <= 0 || this.player2.hp <= 0) {
      this.checkWinner();
    }

    this.debugText.setText([
      `SCORE: P1 [${this.p1Score}] - P2 [${this.p2Score}]`,
      `P1 HP: ${Math.floor(this.player1.hp)} | P2 HP: ${Math.floor(
        this.player2.hp
      )}`,
      `P1 State: ${this.player1.state} | P2 State: ${this.player2.state}`,
    ]);
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

    let winner = "";
    if (this.player1.hp > this.player2.hp) winner = "P1";
    else if (this.player2.hp > this.player1.hp) winner = "P2";
    else winner = "DRAW";

    if (winner === "P1") this.p1Score++;
    else if (winner === "P2") this.p2Score++;

    this.p1Surrender.setVisible(false);
    this.p2Surrender.setVisible(false);

    if (this.p1Score >= this.needsWins || this.p2Score >= this.needsWins) {
      this.displayFinalVictory(winner);
    } else {
      this.displayRoundVictory(winner);
    }
  }

  displayRoundVictory(winner) {
    let msg = winner === "DRAW" ? "MATCH NUL !" : `ROUND POUR ${winner}`;
    let roundTxt = this.add
      .text(400, 200, msg, {
        fontSize: "40px",
        backgroundColor: "#000",
        padding: 15,
        color: "#fff",
      })
      .setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      roundTxt.destroy();
      this.startNewRound();
    });
  }

  displayFinalVictory(winner) {
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    this.add
      .text(400, 250, `${winner} GAGNE LE MATCH !`, {
        fontSize: "60px",
        fill: "#0f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    let retryBtn = this.add
      .text(400, 400, "APPUYEZ SUR [R] POUR RECOMMENCER", {
        fontSize: "24px",
        fill: "#fff",
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-R", () => {
      this.p1Score = 0;
      this.p2Score = 0;
      this.scene.restart();
    });
  }
}
