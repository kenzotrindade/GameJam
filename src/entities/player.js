import Phaser from "phaser";
import { gameConfig } from "../constants.js";

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, color) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.baseColor = color;
    this.setTint(this.baseColor);

    this.hp = gameConfig.maxHp;
    this.state = "IDLE";
    this.isAttacking = false;
    this.isBlocking = false;
    this.direction = 1;
  }

  update(keys) {
    if (this.state === "HURT" || this.state === "DEAD") return;

    this.setVelocityX(0);
    this.setScale(1, 1);
    this.body.setSize(this.width, this.height);

    const speed = 160;

    if (keys.left.isDown) {
      this.setVelocityX(-speed);
      if (this.state !== "ATTACK") this.state = "WALK";
    } else if (keys.right.isDown) {
      this.setVelocityX(speed);
      if (this.state !== "ATTACK") this.state = "WALK";
    } else if (keys.down.isDown) {
      this.setScale(1, 0.5);
      this.body.setSize(this.width, this.height);
    } else {
      if (this.state !== "ATTACK") this.state = "IDLE";
    }

    if (keys.up.isDown && this.body.touching.down) {
      this.setVelocityY(-330);
    }
  }

  takeDamage(amount, attackerX) {
    if (this.state === "DEAD") return;

    if (this.isBlocking) {
      amount = 0;
    }

    this.hp -= amount;

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = "DEAD";
      this.setTint(0x000000);
      console.log("KO !");
      return;
    }

    this.state = "HURT";
    this.setTint(0xff0000);

    const knockbackDir = this.x < attackerX ? -1 : 1;
    this.setVelocityX(gameConfig.knockbackX * knockbackDir);
    this.setVelocityY(gameConfig.knockbackY);

    this.scene.time.delayedCall(gameConfig.hitstuntDuration, () => {
      this.clearTint();
      this.setTint(this.baseColor);

      if (this.state !== "DEAD") {
        this.state = "IDLE";
      }
    });
  }

  updateFacing(opponent) {
    if (this.state === "HURT" || this.state === "DEAD") return;

    if (this.x < opponent.x) {
      this.setFlipX(false);
      this.direction = 1;
    } else {
      this.setFlipX(true);
      this.direction = -1;
    }
  }

  handleInput(data) {
    if (this.state === "HURT" || this.state === "DEAD") return;
    return data;
  }
}
