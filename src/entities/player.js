import Phaser from "phaser";
import { gameConfig } from "../constants.js";

const statePlayer = Object.freeze({
  idle: 0,
  walk: 1,
  attack: 2,
  block: 3,
  hitstun: 4,
  dead: 5,
  dash: 6,
  jump: 7,
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
    this.hp = gameConfig.maxHp;
    this.state = statePlayer.idle;
    this.direction = x > scene.sys.game.config.width / 2 ? -1 : 1;
    this.setFlipX(this.direction === -1);
    this.clearTint();
    this.lastclick = [null, null, null, null, null];
  }

  update(keys, opponent) {
    if (this.state === statePlayer.dead) {
      this.setVelocityX(0);
      this.setTint(0x333333);
      return;
    }

    if (this.state !== statePlayer.hitstun) {
      this.clearTint();
    } else {
      return;
    }

    const isGrounded = this.body.touching.down;
    this.setVelocityX(0);
    this.setScale(4, 4);
    this.body.setSize(this.width, this.height);
    this.body.setOffset(0, 0);

    if (this.state === statePlayer.attack) return;

    if (Phaser.Input.Keyboard.JustDown(keys.attack)) {
      this.executeAttack();
      return;
    }

    const walkSpeed = 300;
    const walkBackSpeed = 200;

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
    } else if (keys.down.isDown && isGrounded) {
      this.setScale(4, 3.5);
      this.body.setSize(this.width, this.height / 2);
      this.body.setOffset(0, this.height / 2);
    } else {
      this.state = statePlayer.idle;
    }

    if (keys.up.isDown && isGrounded) {
      this.setVelocityY(-800);
    }
  }

  executeAttack() {
    this.state = statePlayer.attack;
    this.setVelocityX(0);
    this.setTint(0xffff00);

    const boxWidth = 100;
    const playerHalfWidth = this.displayWidth / 2;

    const hitboxHalfWidth = boxWidth / 2;
    const offset = playerHalfWidth + hitboxHalfWidth;
    const hitboxX = this.x + offset * this.direction;
    const hitboxY = this.y - this.height / 2;

    const hitbox = this.scene.add.rectangle(
      hitboxX,
      hitboxY,
      boxWidth,
      100,
      0xffffff,
      0
    );
    this.scene.physics.add.existing(hitbox);
    const enemy =
      this === this.scene.player1 ? this.scene.player2 : this.scene.player1;
    if (enemy) {
      this.scene.physics.overlap(hitbox, enemy, () => {
        if (
          enemy.state !== statePlayer.hitstun &&
          enemy.state !== statePlayer.dead
        ) {
          enemy.takeDamage(10, this.x);
        }
      });
    }
    this.scene.time.delayedCall(300, () => {
      hitbox.destroy();
      if (this.state !== statePlayer.dead) this.state = statePlayer.idle;
    });
  }

  takeDamage(amount, attackerX) {
    if (this.state === statePlayer.dead) return;
    if (this.state === statePlayer.block) amount = Math.floor(amount * 0.2);
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = statePlayer.dead;
      this.setTint(0x333333);
      this.setVelocityX(0);
      return;
    }
    this.state = statePlayer.hitstun;
    this.setTint(0xff8888);
    const knockbackDir = this.x < attackerX ? -1 : 1;
    this.setVelocityX(200 * knockbackDir);
    this.setVelocityY(-200);
    this.scene.time.delayedCall(500, () => {
      if (this.state !== statePlayer.dead) {
        this.state = statePlayer.idle;
        this.clearTint();
      }
    });
  }

  updateFacing(opponent) {
    if (
      this.state === statePlayer.hitstun ||
      this.state === statePlayer.dead ||
      this.state === statePlayer.attack
    )
      return;
    this.setFlipX(this.x > opponent.x);
    this.direction = this.x > opponent.x ? -1 : 1;
  }
}
