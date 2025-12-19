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
    this.debugMode = false;
    this.pad1 = null;
    this.pad2 = null;
  }

  preload() {
    // 1. CHARGEMENT BASIQUE
    this.load.image("fond", "img/1125239.jpg");
    const frameConfig = { frameWidth: 200, frameHeight: 200 };

    // 2. CHARGEMENT AUDIO
    this.load.audio("ko_sound", "audio/ko.mp3"); // Ajout du slash / par sécurité
    for (let i = 1; i <= 3; i++) {
      this.load.audio(`katana_${i}`, `audio/katana${i}.mp3`);
    }
    for (let i = 1; i <= 5; i++) {
      this.load.audio(`round_${i}`, `audio/round${i}.mp3`);
    }

    // 3. CHARGEMENT DES PERSONNAGES
    const colors = ["red", "emerald", "blue", "yellow", "purple"];
    const folders = {
      red: "RedProtector",
      emerald: "EmeraldProtector",
      blue: "BlueProtector",
      yellow: "YellowProtector",
      purple: "PurpleProtector",
    };

    colors.forEach((color) => {
      const folder = folders[color];
      // On utilise "/img/..." pour éviter les erreurs 404

      this.load.spritesheet(
        `${color}_idle`,
        `img/${folder}/Idle.png`,
        frameConfig
      );
      this.load.spritesheet(
        `${color}_run`,
        `img/${folder}/Run.png`,
        frameConfig
      );
      this.load.spritesheet(
        `${color}_jump`,
        `img/${folder}/Jump.png`,
        frameConfig
      );
      this.load.spritesheet(
        `${color}_fall`,
        `img/${folder}/Fall.png`,
        frameConfig
      );
      this.load.spritesheet(
        `${color}_attack1`,
        `img/${folder}/Attack1.png`,
        frameConfig
      );
      this.load.spritesheet(
        `${color}_attack2`,
        `img/${folder}/Attack2.png`,
        frameConfig
      );

      this.load.spritesheet(
        `${color}_hit`,
        `img/${folder}/TakeHit.png`,
        frameConfig
      );

      this.load.spritesheet(
        `${color}_death`,
        `img/${folder}/Death.png`,
        frameConfig
      );
    });

    // PARTICULES
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffb7c5, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("petal", 8, 8);

    const impactGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    impactGraphics.fillStyle(0xff0000, 1);
    impactGraphics.fillRect(0, 0, 6, 6);
    impactGraphics.generateTexture("hit_particle", 6, 6);
  }

  create() {
    const { width, height } = this.scale;

    this.input.gamepad.once("connected", (pad) => {
      this.pad1 = pad;
      console.log("Pad 1 connecté");
    });
    this.input.gamepad.on("connected", (pad) => {
      if (this.pad1 && pad.index !== this.pad1.index) {
        this.pad2 = pad;
        console.log("Pad 2 connecté");
      }
    });

    this.koSound = this.sound.add("ko_sound");
    this.katanaSounds = {
      low: this.sound.add("katana_1"),
      mid: this.sound.add("katana_2"),
      heavy: this.sound.add("katana_3"),
    };
    this.roundSounds = {};
    for (let i = 1; i <= 5; i++) {
      this.roundSounds[i] = this.sound.add(`round_${i}`);
    }

    // DÉCOR
    this.add.image(width / 2, height / 2, "fond").setDisplaySize(width, height);

    // PARTICULES
    this.hitParticles = this.add.particles(0, 0, "hit_particle", {
      speed: { min: 150, max: 400 },
      scale: { start: 1.5, end: 0 },
      lifespan: 600,
      gravityY: 1000,
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    this.hitParticles.setDepth(100);

    // RÉCUPÉRATION DES CHOIX
    const p1Skin = this.registry.get("p1_skin") || "red";
    const p2Skin = this.registry.get("p2_skin") || "emerald";
    console.log(`Combat : ${p1Skin} VS ${p2Skin}`);

    // CRÉATION DES ANIMATIONS
    const createAnimsFor = (prefix) => {
      this.anims.create({
        key: `${prefix}_idle`,
        frames: this.anims.generateFrameNumbers(`${prefix}_idle`, {
          start: 0,
          end: 7,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `${prefix}_run`,
        frames: this.anims.generateFrameNumbers(`${prefix}_run`, {
          start: 0,
          end: 7,
        }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: `${prefix}_jump`,
        frames: this.anims.generateFrameNumbers(`${prefix}_jump`, {
          start: 0,
          end: 1,
        }),
        frameRate: 2,
        repeat: -1,
      });
      this.anims.create({
        key: `${prefix}_fall`,
        frames: this.anims.generateFrameNumbers(`${prefix}_fall`, {
          start: 0,
          end: 1,
        }),
        frameRate: 2,
        repeat: -1,
      });
      this.anims.create({
        key: `${prefix}_attack1`,
        frames: this.anims.generateFrameNumbers(`${prefix}_attack1`, {
          start: 0,
          end: 5,
        }),
        frameRate: 15,
        repeat: 0,
      });
      this.anims.create({
        key: `${prefix}_attack2`,
        frames: this.anims.generateFrameNumbers(`${prefix}_attack2`, {
          start: 0,
          end: 5,
        }),
        frameRate: 15,
        repeat: 0,
      });
      this.anims.create({
        key: `${prefix}_hit`,
        frames: this.anims.generateFrameNumbers(`${prefix}_hit`, {
          start: 0,
          end: 3,
        }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: `${prefix}_death`,
        frames: this.anims.generateFrameNumbers(`${prefix}_death`, {
          start: 0,
          end: 5,
        }),
        frameRate: 10,
        repeat: 0,
      });

      this.debugBtn = this.add
        .text(width / 2, 20, "DEBUG: OFF", {
          fontSize: "16px",
          backgroundColor: "#333",
          padding: { x: 10, y: 5 },
          fill: "#fff",
        })
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0)
        .setDepth(1000);

      this.debugBtn.on("pointerdown", () => {
        this.debugMode = !this.debugMode;
        this.debugBtn.setText(`DEBUG: ${this.debugMode ? "ON" : "OFF"}`);
        this.debugBtn.setBackgroundColor(this.debugMode ? "#090" : "#333");

        // Gestion de la physique
        this.physics.world.drawDebug = this.debugMode;

        if (this.debugMode) {
          if (!this.physics.world.debugGraphic) {
            this.physics.world.createDebugGraphic();
          }
        } else {
          if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.clear();
          }
        }
      });
      this.physics.world.drawDebug = false;
    };

    createAnimsFor(p1Skin);
    if (p1Skin !== p2Skin) {
      createAnimsFor(p2Skin);
    }

    // PHYSIQUE
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

    // CRÉATION JOUEURS
    this.player1 = new Player(this, 250, height - 100, p1Skin, null);
    this.player2 = new Player(this, width - 250, height - 100, p2Skin, null);

    this.physics.add.collider(this.player1, platforms);
    this.physics.add.collider(this.player2, platforms);
    this.physics.add.collider(this.player1, this.player2);

    // CONTROLES
    this.keysP1 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      lowattack: Phaser.Input.Keyboard.KeyCodes.W,
      midattack: Phaser.Input.Keyboard.KeyCodes.X,
      heavyattack: Phaser.Input.Keyboard.KeyCodes.C,
      dash: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.keysP2 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      lowattack: Phaser.Input.Keyboard.KeyCodes.U,
      midattack: Phaser.Input.Keyboard.KeyCodes.I,
      heavyattack: Phaser.Input.Keyboard.KeyCodes.O,
      dash: Phaser.Input.Keyboard.KeyCodes.TAB,
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

    this.createSurrenderButtons(width);

    // MENU DE DÉPART (BO3/BO5)
    this.showMenu();
  }

  createHealthBars(width, height) {
    const barWidth = 300;
    const barHeight = 30;
    const y = 50;

    // P1
    this.add
      .rectangle(width * 0.3, y, barWidth + 5, barHeight + 5, 0x000000, 0.5)
      .setOrigin(1, 0.5);
    this.healthBar1 = this.add
      .rectangle(width * 0.3, y, barWidth, barHeight, 0x27f527)
      .setOrigin(1, 0.5)
      .setVisible(false);

    // P2
    this.add
      .rectangle(width * 0.7, y, barWidth + 5, barHeight + 5, 0x000000, 0.5)
      .setOrigin(0, 0.5);
    this.healthBar2 = this.add
      .rectangle(width * 0.7, y, barWidth, barHeight, 0x27f527)
      .setOrigin(0, 0.5)
      .setVisible(false);
  }

  createSurrenderButtons(width) {
    this.p1Surrender = this.add
      .text(width * 0.3 - 300, 80, "ABANDON [P1]", {
        backgroundColor: "#900",
        padding: 5,
        fontSize: "16px",
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.handleManualWin("P2"))
      .setVisible(false);

    this.p2Surrender = this.add
      .text(width * 0.7 + 300, 80, "ABANDON [P2]", {
        backgroundColor: "#900",
        padding: 5,
        fontSize: "16px",
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.handleManualWin("P1"))
      .setVisible(false);
  }

  showMenu() {
    const { width, height } = this.scale;
    let txt = this.add
      .text(width / 2, height / 2 - 100, "武士道 - BUSHIDO", {
        fontSize: "60px",
        fontStyle: "bold",
        fill: "#000",
        stroke: "#fff",
        strokeThickness: 6,
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

    if (t.destroy) t.destroy();
    if (b3.destroy) b3.destroy();
    if (b5.destroy) b5.destroy();

    this.healthBar1.setVisible(true);
    this.healthBar2.setVisible(true);
    this.timerText.setVisible(true);
    if (this.p1Surrender) this.p1Surrender.setVisible(true);
    if (this.p2Surrender) this.p2Surrender.setVisible(true);

    this.startNewRound();
  }

  startNewRound() {
    this.physics.resume();
    this.gameOver = false;
    this.isPaused = true;
    this.timeLeft = 99;
    this.timerText.setText("99");

    const currentRoundNumber = this.p1Score + this.p2Score + 1;
    // JOUER SON ROUND
    if (this.roundSounds[currentRoundNumber]) {
      this.roundSounds[currentRoundNumber].play();
    }

    if (this.player1.resetPosition) {
      this.player1.resetPosition(250, this.scale.height - 100);
      this.player2.resetPosition(
        this.scale.width - 250,
        this.scale.height - 100
      );
    } else {
      this.player1.setPosition(250, this.scale.height - 100);
      this.player2.setPosition(this.scale.width - 250, this.scale.height - 100);
      this.player1.hp = gameConfig.maxHp;
      this.player2.hp = gameConfig.maxHp;
    }

    let introText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "", {
        fontSize: "100px",
        fontStyle: "bold",
        fill: "#000",
        stroke: "#fff",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    let steps = ["3", "2", "1", "勝負 !"];
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

    if (!this.debugGraphics) {
      this.debugGraphics = this.add.graphics().setDepth(999);
    }

    this.debugGraphics.clear();

    if (this.debugMode) {
      this.debugGraphics.lineStyle(2, 0x00ff00, 1); // Ligne verte

      // Ligne pour Player 1
      this.drawDirectionLine(this.player1);
      // Ligne pour Player 2
      this.drawDirectionLine(this.player2);
    }

    this.player1.update(this.keysP1, this.player2, this.pad1);
    this.player2.update(this.keysP2, this.player1, this.pad2);

    this.player1.updateFacing(this.player2);
    this.player2.updateFacing(this.player1);

    // --- Dans ta méthode update() ---

    // 1. Calcul des ratios (0 à 1)
    const p1LifeRatio = this.player1.hp / gameConfig.maxHp;
    const p2LifeRatio = this.player2.hp / gameConfig.maxHp;

    // 2. Animation fluide de la largeur (Lerp)
    // On ajuste doucement la largeur actuelle vers la largeur cible (300 * ratio)
    this.healthBar1.width = Phaser.Math.Linear(
      this.healthBar1.width,
      p1LifeRatio * 300,
      0.1
    );
    this.healthBar2.width = Phaser.Math.Linear(
      this.healthBar2.width,
      p2LifeRatio * 300,
      0.1
    );

    // 3. Changement de couleur dynamique (Vert -> Rouge)
    // Interpolation entre Vert (0x27f527) et Rouge (0xff0000)
    const color1 = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xff0000), // Rouge (0% vie)
      Phaser.Display.Color.ValueToColor(0x27f527), // Vert (100% vie)
      1,
      p1LifeRatio
    );
    const color2 = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xff0000),
      Phaser.Display.Color.ValueToColor(0x27f527),
      1,
      p2LifeRatio
    );

    // Appliquer les couleurs
    this.healthBar1.setFillStyle(
      Phaser.Display.Color.GetColor(color1.r, color1.g, color1.b)
    );
    this.healthBar2.setFillStyle(
      Phaser.Display.Color.GetColor(color2.r, color2.g, color2.b)
    );

    this.healthBar1.width = (this.player1.hp / gameConfig.maxHp) * 300;
    this.healthBar2.width = (this.player2.hp / gameConfig.maxHp) * 300;

    if (this.player1.hp <= 0 || this.player2.hp <= 0) {
      this.checkWinner();
    }
  }

  handleManualWin(winner) {
    if (winner === "P1") this.player2.hp = 0;
    else this.player1.hp = 0;
    this.checkWinner();
  }

  checkWinner() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.gameOver) return;

    if (this.koSound) this.koSound.play();

    this.gameOver = true;

    let winner =
      this.player1.hp > this.player2.hp
        ? "P1"
        : this.player2.hp > this.player1.hp
        ? "P2"
        : "DRAW";

    if (winner === "P1") this.p1Score++;
    else if (winner === "P2") this.p2Score++;

    if (this.p1Score >= this.needsWins || this.p2Score >= this.needsWins) {
      this.displayFinalVictory(winner);
    } else {
      this.displayRoundVictory(winner);
    }
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

    this.time.delayedCall(3000, () => {
      roundTxt.destroy();
      this.startNewRound();
    });
  }

  displayFinalVictory(winner) {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    this.add
      .text(width / 2, height / 2 - 50, `${winner} GAGNE !`, {
        fontSize: "80px",
        fill: "#ff0",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 80, "APPUYEZ SUR [R] POUR RECOMMENCER", {
        fontSize: "24px",
        fill: "#fff",
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-R", () => {
      this.p1Score = 0;
      this.p2Score = 0;
      this.scene.restart();
    });

    this.add
      .text(width / 2, height / 2 + 140, "[M] Retour au Menu", {
        fontSize: "28px",
        fill: "#fff",
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-M", () => {
      this.game.destroy(true);
      window.dispatchEvent(new Event("reset-menu"));
    });
  }

  // Ajoute ceci après displayFinalVictory(winner) { ... }
  drawDirectionLine(player) {
    if (!player) return;
    const length = 60;
    const startX = player.x;
    const startY = player.y;
    // On vérifie le flipX pour la direction
    const direction = player.flipX ? -1 : 1;

    this.debugGraphics.lineBetween(
      startX,
      startY,
      startX + length * direction,
      startY
    );
  }
}
