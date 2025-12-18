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
});

const dataAttack = {
  low: {
    damage: 5,
    range: 120,
    hitstuntDuration: 250,
    color: 0xd64629,
  },
  mid: {
    damage: 10,
    range: 140,
    hitstuntDuration: 600,
    color: 0xd64629,
  },
  heavy: {
    damage: 15,
    range: 160,
    hitstuntDuration: 900,
    color: 0xd64629,
  },
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, color) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.setScale(5);
    this.baseColor = color;
    this.hp = gameConfig.maxHp;
    this.state = statePlayer.idle;
    this.direction = x > scene.sys.game.config.width / 2 ? -1 : 1;
    this.setFlipX(this.direction === -1);
    this.clearTint();
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
    this.setScale(5, 5);
    this.body.setSize(this.width, this.height);
    this.body.setOffset(0, 0);

    if (this.state === statePlayer.attack) return;

    if (Phaser.Input.Keyboard.JustDown(keys.lowattack)) {
      this.executeAttack("low");
      return;
    } else if (Phaser.Input.Keyboard.JustDown(keys.midattack)) {
      this.executeAttack("mid");
      return;
    } else if (Phaser.Input.Keyboard.JustDown(keys.heavyattack)) {
      this.executeAttack("heavy");
      return;
    }

    const walkSpeed = 300;
    const walkBackSpeed = 200;

    if (Phaser.Input.Keyboard.JustDown(keys.dash) && !this.indash) {
      this.indash = true;
      let dash = 0;
      if (keys.left.isDown) {
        dash = this.x < opponent.x ? -walkBackSpeed * 3 : -walkSpeed * 3;
      } else if (keys.right.isDown) {
        dash = this.x > opponent.x ? walkBackSpeed * 3 : walkSpeed * 3;
      }
      if (dash !== 0) {
        this.setVelocityX(dash);
        this.scene.time.delayedCall(200, () => {});
      }
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
    } else if (keys.down.isDown && isGrounded) {
      this.setScale(5, 3.5);
    } else {
      this.state = statePlayer.idle;
    }

    if (keys.up.isDown && isGrounded) {
      this.setVelocityY(-1500);
    }
  }

  executeAttack(type) {
    const config = dataAttack[type];
    this.state = statePlayer.attack;
    this.setVelocityX(0);
    this.setTint(config.color);

    const playerHalfWidth = this.displayWidth / 2;
    const hitboxHalfWidth = config.range / 2;
    const offset = playerHalfWidth + hitboxHalfWidth;
    const hitboxX = this.x + offset * this.direction;
    const hitboxY = this.y - this.displayHeight / 2;

    const hitbox = this.scene.add.rectangle(
      hitboxX,
      hitboxY,
      config.range,
      100,
      0xffffff,
      0
    );
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);

    const enemy =
      this === this.scene.player1 ? this.scene.player2 : this.scene.player1;

    if (enemy) {
      this.scene.physics.overlap(hitbox, enemy, () => {
        if (
          enemy.state !== statePlayer.hitstun &&
          enemy.state !== statePlayer.dead
        ) {
          enemy.takeDamage(config.damage, this.x);
        }
      });
    }

    this.scene.time.delayedCall(config.hitstuntDuration, () => {
      hitbox.destroy();
      if (
        this.state !== statePlayer.dead &&
        this.state !== statePlayer.hitstun
      ) {
        this.state = statePlayer.idle;
        this.clearTint();
      }
    });
  }

  takeDamage(amount, attackerX) {
    if (this.scene.hitParticles) {
      this.scene.hitParticles.explode(20, this.x, this.y - 60);
    }
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
