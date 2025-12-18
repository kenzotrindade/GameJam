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
  }

  preload() {
    this.load.image("samurai_p1", "img/samourai.png");
    this.load.image("samurai_p2", "img/samourai2.png");
    this.load.image("fond", "img/1125239.jpg");

    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffb7c5, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("petal", 8, 8);
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, "fond").setDisplaySize(width, height);
    /*    this.add.rectangle(width / 2, height / 2, width, height, 0xf7d29a);
    this.add.circle(width / 2, height * 0.4, 150, 0xff4d4d);
*/
    this.add.particles(0, 0, "petal", {
      x: { min: 0, max: width },
      y: -10,
      lifespan: 6000,
      speedY: { min: 40, max: 100 },
      speedX: { min: -20, max: 50 },
      scale: { start: 0.8, end: 0.4 },
      rotate: { min: 0, max: 360 },
      gravityY: 20,
      frequency: 150,
    });

    const impactGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    impactGraphics.fillStyle(0xff0000, 1);
    impactGraphics.fillRect(0, 0, 4, 4);
    impactGraphics.generateTexture("hit_particle", 4, 4);

    this.hitParticles = this.add.particles(0, 0, "hit_particle", {
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 600,
      gravityY: 500,
      emitting: false,
      emitZone: {
        type: "random",
        source: new Phaser.Geom.Rectangle(-25, -120, 50, 120),
      },
    });
    this.hitParticles.setDepth(100);

    const platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(
      width / 2,
      height - 20,
      width,
      40,
      0x222222
    );
    this.physics.add.existing(ground, true);
    platforms.add(ground);

    this.player1 = new Player(this, 250, height - 200, "samurai_p1", 0xff3333);
    this.player2 = new Player(
      this,
      width - 250,
      height - 200,
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
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.keysP2 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      attack: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });

    this.createHealthBars(width, height);

    this.timerText = this.add
      .text(width / 2, 70, "99", {
        fontSize: "60px",
        fill: "#fff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.showMenu();
  }

  createHealthBars(width, height) {
    const barWidth = 400;
    const barHeight = 40;
    const y = 70;

    this.add
      .rectangle(width * 0.45, y, barWidth + 10, barHeight + 10, 0x000000)
      .setOrigin(1, 0.5);
    this.add
      .rectangle(width * 0.45 - 5, y, barWidth, barHeight, 0x333333)
      .setOrigin(1, 0.5);
    this.healthBar1 = this.add
      .rectangle(width * 0.45 - 5, y, barWidth, barHeight, 0xffff00)
      .setOrigin(1, 0.5)
      .setVisible(false);
    this.p1Name = this.add
      .text(width * 0.45 - barWidth, y - 40, "SAMURAI I", {
        fontSize: "24px",
        fontStyle: "bold",
        fill: "#000",
      })
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.add
      .rectangle(width * 0.55, y, barWidth + 10, barHeight + 10, 0x000000)
      .setOrigin(0, 0.5);
    this.add
      .rectangle(width * 0.55 + 5, y, barWidth, barHeight, 0x333333)
      .setOrigin(0, 0.5);
    this.healthBar2 = this.add
      .rectangle(width * 0.55 + 5, y, barWidth, barHeight, 0xffff00)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.p2Name = this.add
      .text(width * 0.55 + barWidth, y - 40, "SAMURAI II", {
        fontSize: "24px",
        fontStyle: "bold",
        fill: "#000",
      })
      .setOrigin(1, 0.5)
      .setVisible(false);
  }

  showMenu() {
    const { width, height } = this.scale;
    let txt = this.add
      .text(width / 2, height / 2 - 100, "武士道 - BUSHIDO", {
        fontSize: "60px",
        fontStyle: "bold",
        fill: "#000",
      })
      .setOrigin(0.5);
    const btnStyle = {
      fontSize: "32px",
      fill: "#fff",
      backgroundColor: "#000",
      padding: { x: 20, y: 10 },
    };
    let btn3 = this.add
      .text(width / 2 - 120, height / 2, "BO3", btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    let btn5 = this.add
      .text(width / 2 + 120, height / 2, "BO5", btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
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
    this.p1Name.setVisible(true);
    this.p2Name.setVisible(true);
    this.timerText.setVisible(true);
    this.startNewRound();
  }

  startNewRound() {
    this.physics.resume();
    this.gameOver = false;
    this.isPaused = true;
    this.timeLeft = 99;
    this.timerText.setText("99");
    this.player1.setPosition(250, 500).state = 0;
    this.player2.setPosition(this.scale.width - 250, 500).state = 0;
    this.player1.hp = gameConfig.maxHp;
    this.player2.hp = gameConfig.maxHp;
    this.player1.clearTint();
    this.player2.clearTint();

    let introText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "", {
        fontSize: "100px",
        fontStyle: "bold",
        fill: "#000",
        stroke: "#fff",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    let steps = ["3", "2", "1", "いざ尋常に... 勝負 !"];
    steps.forEach((val, i) => {
      this.time.delayedCall(i * 1000, () => {
        introText.setText(val);
        if (i === 3) {
          this.isPaused = false;
          this.time.delayedCall(800, () => introText.destroy());
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

    this.updateHealthBar(this.healthBar1, this.player1.hp);
    this.updateHealthBar(this.healthBar2, this.player2.hp);

    if (this.player1.hp <= 0 || this.player2.hp <= 0) this.checkWinner();
  }

  updateHealthBar(bar, hp) {
    const percentage = hp / gameConfig.maxHp;
    bar.width = percentage * 400;
    if (percentage < 0.25) bar.setFillStyle(0xff0000);
    else if (percentage < 0.5) bar.setFillStyle(0xffa500);
    else bar.setFillStyle(0xffff00);
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
      .text(this.scale.width / 2, 250, `勝者: ${winner}`, {
        fontSize: "60px",
        fill: "#fff",
        backgroundColor: "#000",
        padding: 20,
      })
      .setOrigin(0.5);
    this.time.delayedCall(2000, () => {
      roundTxt.destroy();
      this.startNewRound();
    });
  }

  displayFinalVictory(winner) {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    this.add
      .text(width / 2, height / 2 - 50, `${winner} 全勝 !`, {
        fontSize: "80px",
        fill: "#ff0",
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 80, "PRESS [R] TO REVENGE", {
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
