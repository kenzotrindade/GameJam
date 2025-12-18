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

    this.setOrigin(0, 1);
    this.setCollideWorldBounds(true);
    this.setScale(4);

    this.baseColor = color;

    this.hp = gameConfig.maxHp;
    this.state = statePlayer.idle;
    this.direction = 1;

    this.lastclick = [];
  }

  update(keys, opponent) {
    if (this.state === statePlayer.hitstun || this.state === statePlayer.dead) {
      return;
    }

    const isGrounded = this.body.touching.down;

    if (this.state !== statePlayer.attack) {
      this.setVelocityX(0);
    }

    this.setScale(4, 4);
    this.body.setSize(this.width, this.height);
    this.body.setOffset(0, 0);

    if (this.state === statePlayer.attack) {
      return;
    }

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
      this.setVelocityY(-550);
    }
  }

  executeAttack() {
    this.state = statePlayer.attack;
    this.setVelocityX(0);

    const hitboxX = this.x + 40 * this.direction;
    const hitboxY = this.y - this.height / 2;

    const hitbox = this.scene.add.rectangle(
      hitboxX,
      hitboxY,
      100,
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

    this.scene.time.delayedCall(1000, () => {
      hitbox.destroy();

      if (
        this.state !== statePlayer.hitstun &&
        this.state !== statePlayer.dead
      ) {
        this.state = statePlayer.idle;
      }
    });
  }

  takeDamage(amount, attackerX) {
    if (this.state === statePlayer.dead) return;

    if (this.state === statePlayer.block) {
      amount = Math.floor(amount * 0.2);
      console.log("Bloqué !");
    }

    this.hp -= amount;

    // Mort
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = statePlayer.dead;
      return;
    }

    this.state = statePlayer.hitstun;

    const knockbackDir = this.x < attackerX ? -1 : 1;
    this.setVelocityX(200 * knockbackDir);
    this.setVelocityY(-200);

    this.scene.time.delayedCall(gameConfig.hitstuntDuration || 400, () => {
      if (this.state !== statePlayer.dead) {
        this.clearTint();
        this.state = statePlayer.idle;
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
    if (this.x < opponent.x) {
      this.setFlipX(false);
      this.direction = 1;
    } else {
      this.setFlipX(true);
      this.direction = -1;
    }
  }
}
