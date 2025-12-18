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
    this.load.image("fond", "img/1125239.jpg");

    // --- CHARGEMENT DES SPRITES ---
    // On spécifie la taille standard 200x200.
    // Si ça affiche encore un carré noir, c'est que tes images ne font pas 200px de haut.
    // Ouvre tes images sur ton ordi pour vérifier leur taille (ex: 1600x200).
    const frameConfig = { frameWidth: 200, frameHeight: 200 };

    this.load.spritesheet(
      "samurai_idle",
      "img/EmeraldProtector/Idle.png",
      frameConfig
    );
    this.load.spritesheet(
      "samurai_run",
      "img/EmeraldProtector/Run.png",
      frameConfig
    );
    this.load.spritesheet(
      "samurai_jump",
      "img/EmeraldProtector/Jump.png",
      frameConfig
    );
    this.load.spritesheet(
      "samurai_fall",
      "img/EmeraldProtector/Fall.png",
      frameConfig
    );

    // ATTENTION : Attack1 a 6 frames, Attack2 a 6 frames
    this.load.spritesheet(
      "samurai_attack1",
      "img/EmeraldProtector/Attack1.png",
      frameConfig
    );
    this.load.spritesheet(
      "samurai_attack2",
      "img/EmeraldProtector/Attack2.png",
      frameConfig
    );

    // Take Hit a 4 frames
    this.load.spritesheet(
      "samurai_hit",
      "img/EmeraldProtector/Take Hit.png",
      frameConfig
    );

    // Death a 6 frames
    this.load.spritesheet(
      "samurai_death",
      "img/EmeraldProtector/Death.png",
      frameConfig
    );

    // ... tes particules ...
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffb7c5, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("petal", 8, 8);

    const impactGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    impactGraphics.fillStyle(0xff0000, 1);
    impactGraphics.fillRect(0, 0, 4, 4);
    impactGraphics.generateTexture("hit_particle", 4, 4);
  }

  create() {
    const { width, height } = this.scale;

    // --- 1. FOND & PARTICULES ---
    this.add.image(width / 2, height / 2, "fond").setDisplaySize(width, height);

    // Pétales d'ambiance
    this.add.particles(0, 0, "petal", {
      x: { min: 0, max: width },
      y: -10,
      lifespan: 6000,
      speedY: { min: 40, max: 100 },
      speedX: { min: -20, max: 50 },
      scale: { start: 0.8, end: 0.4 },
      gravityY: 20,
      frequency: 150,
    });

    // Sang (impacts) - Profondeur 100 pour être devant les joueurs
    this.hitParticles = this.add.particles(0, 0, "hit_particle", {
      speed: { min: 50, max: 200 },
      scale: { start: 1.5, end: 0 },
      lifespan: 600,
      gravityY: 500,
      emitting: false,
    });
    this.hitParticles.setDepth(100);

    // --- 2. CRÉATION DES ANIMATIONS (DÉTAILLÉES) ---
    // On définit le début et la fin pour chaque fichier PNG spécifique

    // Idle (8 frames : 0 à 7)
    this.anims.create({
      key: "samurai_idle",
      frames: this.anims.generateFrameNumbers("samurai_idle", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    });

    // Run (8 frames : 0 à 7)
    this.anims.create({
      key: "samurai_run",
      frames: this.anims.generateFrameNumbers("samurai_run", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Jump (2 frames : 0 à 1)
    this.anims.create({
      key: "samurai_jump",
      frames: this.anims.generateFrameNumbers("samurai_jump", {
        start: 0,
        end: 1,
      }),
      frameRate: 2,
      repeat: -1,
    });

    // Fall (2 frames : 0 à 1)
    this.anims.create({
      key: "samurai_fall",
      frames: this.anims.generateFrameNumbers("samurai_fall", {
        start: 0,
        end: 1,
      }),
      frameRate: 2,
      repeat: -1,
    });

    // Attack 1 (6 frames : 0 à 5)
    this.anims.create({
      key: "samurai_attack1",
      frames: this.anims.generateFrameNumbers("samurai_attack1", {
        start: 0,
        end: 5,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Attack 2 (6 frames : 0 à 5)
    this.anims.create({
      key: "samurai_attack2",
      frames: this.anims.generateFrameNumbers("samurai_attack2", {
        start: 0,
        end: 5,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Take Hit (4 frames : 0 à 3)
    this.anims.create({
      key: "samurai_hit",
      frames: this.anims.generateFrameNumbers("samurai_hit", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Death (6 frames : 0 à 5)
    this.anims.create({
      key: "samurai_death",
      frames: this.anims.generateFrameNumbers("samurai_death", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // --- 3. PHYSIQUE (SOL) ---
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

    this.player1 = new Player(this, 250, height - 100, "samurai", null);
    this.player2 = new Player(this, width - 250, height - 100, "samurai", null);

    // Collisions
    this.physics.add.collider(this.player1, platforms);
    this.physics.add.collider(this.player2, platforms);
    this.physics.add.collider(this.player1, this.player2);

    // --- 5. INPUTS (CLAVIER) ---
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

    // --- 6. INTERFACE (UI) ---
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

    // Boutons d'abandon
    this.createSurrenderButtons(width);

    // Lancement du menu
    this.showMenu();
  }

  // --- MÉTHODES UTILITAIRES ---

  createAnimation(key, frameRate, repeat) {
    // Vérifie si l'anim existe déjà pour éviter les warnings
    if (!this.anims.exists(key)) {
      this.anims.create({
        key: key,
        frames: this.anims.generateFrameNumbers(key),
        frameRate: frameRate,
        repeat: repeat,
      });
    }
  }

  createHealthBars(width, height) {
    const barWidth = 300;
    const barHeight = 30;
    const y = 50;

    // Fond P1
    this.add
      .rectangle(width * 0.3, y, barWidth + 5, barHeight + 5, 0x000000, 0.5)
      .setOrigin(1, 0.5);
    // Barre P1
    this.healthBar1 = this.add
      .rectangle(width * 0.3, y, barWidth, barHeight, 0xffff00)
      .setOrigin(1, 0.5)
      .setVisible(false);

    // Fond P2
    this.add
      .rectangle(width * 0.7, y, barWidth + 5, barHeight + 5, 0x000000, 0.5)
      .setOrigin(0, 0.5);
    // Barre P2
    this.healthBar2 = this.add
      .rectangle(width * 0.7, y, barWidth, barHeight, 0xffff00)
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

    // On nettoie le menu
    t.destroy();
    b3.destroy();
    b5.destroy();

    // On affiche l'interface de combat
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

    // IMPORTANT: Reset complet des joueurs (Position + Animation + Stats)
    // On utilise la méthode resetPosition qu'on a ajoutée dans Player.js
    if (this.player1.resetPosition) {
      this.player1.resetPosition(250, this.scale.height - 100);
      this.player2.resetPosition(
        this.scale.width - 250,
        this.scale.height - 100
      );
    } else {
      // Fallback si la méthode n'existe pas encore
      this.player1.setPosition(250, this.scale.height - 100);
      this.player2.setPosition(this.scale.width - 250, this.scale.height - 100);
      this.player1.hp = gameConfig.maxHp;
      this.player2.hp = gameConfig.maxHp;
    }

    // Compte à rebours visuel
    let introText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "", {
        fontSize: "100px",
        fontStyle: "bold",
        fill: "#000",
        stroke: "#fff",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    let steps = ["3", "2", "1", "勝負 !"]; // "FIGHT !" en Japonais (Shōbu)
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

    // Mise à jour des joueurs
    this.player1.update(this.keysP1, this.player2);
    this.player2.update(this.keysP2, this.player1);

    // Orientation (Flip)
    this.player1.updateFacing(this.player2);
    this.player2.updateFacing(this.player1);

    // Mise à jour Barres de vie
    this.healthBar1.width = (this.player1.hp / gameConfig.maxHp) * 300;
    this.healthBar2.width = (this.player2.hp / gameConfig.maxHp) * 300;

    // Vérification KO
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

    this.gameOver = true;
    // On ne pause pas la physique tout de suite pour laisser l'anim de mort se jouer
    // this.physics.pause();

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
  }
}
