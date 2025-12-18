import Phaser from "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, color) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = gameConfig.maxHp;
    this.isHurt = false;
    this.isAttacking = false;
    this.isBlocking = false;
    this.direction = 1;

    this.setTint(color);
    this.setCollideWorldBounds(true);
  }

  handleInput(data) {
    return data;
  }

  takeDamage() {}
}
