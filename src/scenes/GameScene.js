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
    // On charge tes nouveaux fichiers
    this.load.spritesheet(
      "samurai_p1",
      "img/EmeraldProtector/EmeraldProtector/Idle.png",
      { frameWidth: 128, frameHeight: 128 }
    );
    this.load.spritesheet(
      "samurai_p2",
      "img/TheDarkRedOne/TheDarkRedOne/Idle.png",
      { frameWidth: 128, frameHeight: 128 }
    );

    const ui = this.textures.createCanvas("ui_wood", 260, 40);
    const uctx = ui.getContext();
    uctx.fillStyle = "#3d2b1f";
    uctx.fillRect(0, 0, 260, 40);
    uctx.strokeStyle = "#d4af37";
    uctx.lineWidth = 4;
    uctx.strokeRect(4, 4, 252, 32);
    ui.refresh();

    const petal = this.textures.createCanvas("petal", 10, 10);
    const pctx = petal.getContext();
    pctx.fillStyle = "#ffb7c5";
    pctx.beginPath();
    pctx.arc(5, 5, 5, 0, Math.PI * 2);
    pctx.fill();
    petal.refresh();
  }

  create() {
    const { width, height } = this.scale;
    const sky = this.add.graphics();
    sky.fillGradientStyle(0xfce4ec, 0xfce4ec, 0xffd1dc, 0xffd1dc, 1);
    sky.fillRect(0, 0, width, height);

    const fuji = this.add.graphics();
    fuji.fillStyle(0x2c3e50, 0.8);
    fuji.fillTriangle(
      width / 2 - 350,
      height,
      width / 2,
      120,
      width / 2 + 350,
      height
    );
    fuji.fillStyle(0xffffff, 1);
    fuji.fillTriangle(width / 2 - 75, 265, width / 2, 120, width / 2 + 75, 265);

    this.add.particles(0, 0, "petal", {
      x: { min: 0, max: width },
      y: -20,
      lifespan: 7000,
      speedY: { min: 30, max: 80 },
      speedX: { min: -40, max: 40 },
      rotate: { min: 0, max: 360 },
      scale: { start: 1, end: 0.3 },
      gravityY: 10,
      quantity: 1,
      frequency: 180,
    });

    const platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(
      width / 2,
      height - 25,
      width,
      50,
      0x1a1a1a
    );
    this.physics.add.existing(ground, true);
    platforms.add(ground);

    this.shadow1 = this.add.ellipse(0, 0, 50, 15, 0x000000, 0.2);
    this.shadow2 = this.add.ellipse(0, 0, 50, 15, 0x000000, 0.2);

    this.player1 = new Player(this, 200, 450, "samurai_p1", 0xffffff);
    this.player2 = new Player(this, 600, 450, "samurai_p2", 0xffffff);

    this.physics.add.collider(this.player1, platforms);
    this.physics.add.collider(this.player2, platforms);
    this.physics.add.collider(this.player1, this.player2);
    this.physics.world.setBounds(0, 0, width, height);

    this.setupKeys();
    this.setupUI(width);
    this.showMenu();

    this.events.on("shutdown", () => {
      if (this.timerEvent) this.timerEvent.remove();
      this.input.keyboard.removeAllListeners();
    });
  }

  setupKeys() {
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
  }

  setupUI(width) {
    this.add.image(140, 50, "ui_wood").setScale(0.9);
    this.add
      .image(width - 140, 50, "ui_wood")
      .setScale(0.9)
      .setFlipX(true);
    this.healthBar1 = this.add
      .rectangle(35, 50, 210, 18, 0xe74c3c)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.healthBar2 = this.add
      .rectangle(width - 35, 50, 210, 18, 0xe74c3c)
      .setOrigin(1, 0.5)
      .setVisible(false);
    this.timerText = this.add
      .text(width / 2, 55, "99", {
        fontSize: "55px",
        fontFamily: "Georgia",
        color: "#3d2b1f",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setStroke("#d4af37", 4)
      .setVisible(false);

    this.p1Surrender = this.add
      .text(80, 100, "SEPPUKU", {
        fontSize: "14px",
        backgroundColor: "#800",
        padding: 5,
      })
      .setInteractive()
      .on("pointerdown", () => this.handleManualWin("P2"))
      .setVisible(false);
    this.p2Surrender = this.add
      .text(width - 80, 100, "SEPPUKU", {
        fontSize: "14px",
        backgroundColor: "#800",
        padding: 5,
      })
      .setOrigin(1, 0.5)
      .setInteractive()
      .on("pointerdown", () => this.handleManualWin("P1"))
      .setVisible(false);
  }

  showMenu() {
    const { width } = this.scale;
    const bg = this.add
      .rectangle(width / 2, 300, 450, 180, 0x3d2b1f, 0.9)
      .setStrokeStyle(4, 0xd4af37);
    const txt = this.add
      .text(width / 2, 260, "VOIE DU BUSHIDO", {
        fontSize: "35px",
        color: "#d4af37",
        fontFamily: "Georgia",
      })
      .setOrigin(0.5);
    const b3 = this.add
      .text(width / 2 - 80, 330, "[ BO3 ]", { fontSize: "28px", color: "#fff" })
      .setInteractive();
    const b5 = this.add
      .text(width / 2 + 80, 330, "[ BO5 ]", { fontSize: "28px", color: "#fff" })
      .setInteractive();

    const start = (r) => {
      this.maxRounds = r;
      this.needsWins = Math.ceil(r / 2);
      bg.destroy();
      txt.destroy();
      b3.destroy();
      b5.destroy();
      this.healthBar1.setVisible(true);
      this.healthBar2.setVisible(true);
      this.timerText.setVisible(true);
      this.p1Surrender.setVisible(true);
      this.p2Surrender.setVisible(true);
      this.startNewRound();
    };
    b3.on("pointerdown", () => start(3));
    b5.on("pointerdown", () => start(5));
  }

  startNewRound() {
    if (this.timerEvent) this.timerEvent.remove();
    this.physics.resume();
    this.gameOver = false;
    this.isPaused = true;
    this.timeLeft = 99;
    this.timerText.setText("99");
    this.player1.setPosition(200, 450);
    this.player2.setPosition(600, 450);
    this.player1.hp = gameConfig.maxHp;
    this.player2.hp = gameConfig.maxHp;
    this.player1.clearTint();
    this.player1.setTint(this.player1.baseColor);
    this.player2.clearTint();
    this.player2.setTint(this.player2.baseColor);
    let t = this.add
      .text(400, 300, "HAJIME !", {
        fontSize: "80px",
        color: "#c0392b",
        fontFamily: "Georgia",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.time.delayedCall(1000, () => {
      t.destroy();
      this.isPaused = false;
      this.startTimer();
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
    this.shadow1.setPosition(this.player1.x, this.player1.y);
    this.shadow2.setPosition(this.player2.x, this.player2.y);
    this.healthBar1.width = (this.player1.hp / gameConfig.maxHp) * 210;
    this.healthBar2.width = (this.player2.hp / gameConfig.maxHp) * 210;
    if (this.player1.hp <= 0 || this.player2.hp <= 0) this.checkWinner();
  }

  handleManualWin(winner) {
    if (winner === "P1") this.player2.hp = 0;
    else this.player1.hp = 0;
    this.checkWinner();
  }

  checkWinner() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.timerEvent) this.timerEvent.remove();
    this.physics.pause();
    let win = this.player1.hp > this.player2.hp ? "P1" : "P2";
    if (win === "P1") this.p1Score++;
    else this.p2Score++;
    if (this.p1Score >= this.needsWins || this.p2Score >= this.needsWins) {
      this.displayFinalVictory(win);
    } else {
      this.time.delayedCall(1500, () => this.startNewRound());
    }
  }

  displayFinalVictory(winner) {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    this.add
      .text(width / 2, height / 2 - 50, `${winner} EST LE MAÎTRE`, {
        fontSize: "50px",
        color: "#d4af37",
        fontFamily: "Georgia",
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 50, "APPUYEZ SUR [R] POUR REJOUER", {
        fontSize: "20px",
        color: "#fff",
      })
      .setOrigin(0.5);
    this.input.keyboard.once("keydown-R", () => {
      this.p1Score = 0;
      this.p2Score = 0;
      this.scene.restart();
    });
  }
}
