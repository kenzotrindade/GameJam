import { Player } from "../entities/Player.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    const graphics = this.make.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("square", 32, 32);
    graphics.destroy();

    const platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(400, 580, 800, 40, 0x00ff00);

    this.physics.add.existing(ground, true);
    platforms.add(ground);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysP2 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.player1 = new Player(this, 100, 400, "square");
    this.player2 = new Player(this, 700, 400, "square");

    this.player1.setTint(0x3333ff);
    this.player2.setTint(0xff3333);

    this.physics.add.collider(this.player1, platforms);
    this.physics.add.collider(this.player2, platforms);
    this.physics.add.collider(this.player1, this.player2);
  }

  update() {
    if (this.player1) {
      this.player1.update(this.cursors);
    }
    if (this.player2) {
      this.player2.update(this.keysP2);
    }
  }
}
