import Phaser from "phaser";
import { gameConfig } from "../constants.js";

const statePlayer = Object.freeze({
  idle: 0,
  walk: 1,
  attack: 2,
  block: 3,
  hitstun: 4,
  dead: 5,
});

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, color) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.setScale(4);

    this.baseColor = color;
    this.setTint(this.baseColor);

    this.hp = gameConfig.maxHp;
    this.state = statePlayer.idle;
    this.direction = 1;
  }

  update(keys, opponent) {
    if (
      this.state === statePlayer.attack ||
      this.state === statePlayer.hitstun ||
      this.state === statePlayer.dead
    )
      return;

    this.setVelocityX(0);
    this.setScale(4, 4);
    this.body.setSize(this.width, this.height);
    this.body.setOffset(0, 0);

    const walkSpeed = 300;
    const walkBackSpeed = 200;

    if (Phaser.Input.Keyboard.JustDown(keys.attack)) {
      this.executeAttack(opponent);
      return;
    }

    if (keys.left.isDown) {
      if (this.x < opponent.x) {
        this.setVelocityX(-walkBackSpeed);
        this.state = statePlayer.block;
      } else {
        this.setVelocityX(-walkSpeed);
        this.state = statePlayer.walk;
      }
    } else if (keys.right.isDown) {
      if (this.x > opponent.x) {
        this.setVelocityX(walkBackSpeed);
        this.state = statePlayer.block;
      } else {
        this.setVelocityX(walkSpeed);
        this.state = statePlayer.walk;
      }
    } else if (keys.down.isDown) {
      this.setScale(4, 3.5);
      this.body.setSize(this.width, this.height / 2);
      this.body.setOffset(0, this.height / 2);
    } else {
      this.state = statePlayer.idle;
    }

    if (keys.up.isDown && this.body.touching.down) {
      this.setVelocityY(-400);
    }
  }

  executeAttack(opponent) {
    this.state = statePlayer.attack;
    this.setVelocityX(0);
    this.setTint(0xffffff);

    const range = 150;
    const dist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      opponent.x,
      opponent.y
    );
    const isFacingOpponent =
      (this.direction === 1 && this.x < opponent.x) ||
      (this.direction === -1 && this.x > opponent.x);

    if (dist < range && isFacingOpponent) {
      opponent.takeDamage(10, this.x);
    }

    this.scene.time.delayedCall(300, () => {
      if (this.state !== statePlayer.dead) {
        this.state = statePlayer.idle;
        this.setTint(this.baseColor);
      }
    });
  }

  takeDamage(amount, attackerX) {
    if (this.state === statePlayer.dead) return;
    if (this.state === statePlayer.block) amount = Math.floor(amount * 0.2);

    this.hp -= amount;

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = statePlayer.dead;
      this.setTint(0x000000);
      return;
    }

    this.state = statePlayer.hitstun;
    this.setTint(0xff0000);

    const knockbackDir = this.x < attackerX ? -1 : 1;
    this.setVelocityX(200 * knockbackDir);
    this.setVelocityY(-150);

    this.scene.time.delayedCall(gameConfig.hitstuntDuration || 400, () => {
      if (this.state !== statePlayer.dead) {
        this.clearTint();
        this.setTint(this.baseColor);
        this.state = statePlayer.idle;
      }
    });
  }

  updateFacing(opponent) {
    if (this.state === statePlayer.hitstun || this.state === statePlayer.dead)
      return;
    if (this.x < opponent.x) {
      this.setFlipX(false);
      this.direction = 1;
    } else {
      this.setFlipX(true);
      this.direction = -1;
    }
  }
}
