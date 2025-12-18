import { gameConfig } from "../constants.js";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    scene.add.exisiting(this);
    scene.physics.add.exisiting(this);

    this.setCollideWorldBounds(true);

    this.hp = gameConfig.maxHp;
    this.state = "IDLE";
  }

  takeDamage(amount, attackerX) {
    if (this.state === "DEAD") return;

    this.hp -= amount;
    this.state = "HURT";

    const knockbackDir = this.x < attackerX ? -1 : 1;
    this.setVelocityX(gameConfig.knockbackX * knockbackDir);
    this.setVelocityY(gameConfig.knockbackY);

    this.setTint(0xff0000);

    this.scene.time.delayedCall(gameConfig.hitstuntDuration, () => {
      this.clearTint();
      if (this.hp > 0) {
        this.state = "IDLE";
      } else {
        this.state = "DEAD";
        console.log("KO !");
      }
    });
  }
  updateFacing(opponent) {
    if (this.state === "HURT" || this.state === "DEAD") return;

    if (this.x < opponent.x) {
      this.setFlipX(false);
    } else {
      this.setFlipX(true);
    }
  }
}
