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
    range: 240,
    duration: 400,
    animSuffix: "_attack1",
  },
  mid: {
    damage: 10,
    range: 280,
    duration: 600,
    animSuffix: "_attack2",
  },
  heavy: {
    damage: 15,
    range: 320,
    duration: 900,
    animSuffix: "_attack2",
  },
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, color) {
    super(scene, x, y, textureKey + "_idle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.textureKey = textureKey;

    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);

    this.setScale(3.5);
    this.body.setSize(26, 47);
    this.body.setOffset(87, 75);

    this.baseColor = color;
    if (color) {
      this.setTint(color);
    }

    this.hp = gameConfig.maxHp;
    this.state = statePlayer.idle;
    this.direction = x > scene.sys.game.config.width / 2 ? -1 : 1;
    this.setFlipX(this.direction === -1);

    this.play(this.textureKey + "_idle");
  }

  resetPosition(x, y) {
    this.setPosition(x, y);
    this.state = statePlayer.idle;
    this.hp = gameConfig.maxHp;
    this.setVelocity(0, 0);
    this.clearTint();
    if (this.baseColor) this.setTint(this.baseColor);
    this.play(this.textureKey + "_idle");
  }

  update(keys, opponent) {
    if (this.state === statePlayer.dead) {
      this.setVelocityX(0);
      return;
    }

    if (this.state === statePlayer.hitstun) return;

    const isGrounded = this.body.touching.down;

    if (this.state !== statePlayer.attack) {
      this.setVelocityX(0);
    }

    // --- ANIMATIONS ---
    if (this.state !== statePlayer.attack) {
      if (!isGrounded) {
        if (this.body.velocity.y < 0) {
          this.play(this.textureKey + "_jump", true);
        } else {
          this.play(this.textureKey + "_fall", true);
        }
      } else {
        if (keys.left.isDown || keys.right.isDown) {
          this.play(this.textureKey + "_run", true);
        } else {
          this.play(this.textureKey + "_idle", true);
        }
      }
    }

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

    this.play(this.textureKey + config.animSuffix);

    const bodyHalfWidth = this.body.width / 2;
    const attackHalfWidth = config.range / 2;
    const overlap = 0;
    const offset = bodyHalfWidth + attackHalfWidth - overlap;

    const hitboxX = this.x + offset * this.direction;
    const hitboxY = this.body.center.y;

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

    // A. Événement VISUEL : Retour à l'Idle
    this.once("animationcomplete", () => {
      if (this.state === statePlayer.attack) {
        this.play(this.textureKey + "_idle", true);
      }
    });

    // B. Événement LOGIQUE : Fin du Cooldown
    this.scene.time.delayedCall(config.duration, () => {
      if (hitbox.active) hitbox.destroy();

      if (
        this.state !== statePlayer.dead &&
        this.state !== statePlayer.hitstun
      ) {
        this.state = statePlayer.idle;
        this.play(this.textureKey + "_idle", true);
      }
    });
  }

  takeDamage(amount, attackerX) {
    if (this.state === statePlayer.dead) return;

    const attacker =
      this === this.scene.player1 ? this.scene.player2 : this.scene.player1;
    let knockbackMultiplier = 1.0;

    if (this.state === statePlayer.block) {
      amount = Math.floor(amount * 0.2);
      knockbackMultiplier = 0.5;

      if (attacker) {
        const attackerPushDir = this.x < attackerX ? 1 : -1;
        attacker.setVelocityX(200 * 1.5 * attackerPushDir);
        attacker.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => attacker.clearTint());
      }
    }

    this.hp -= amount;

    if (this.scene.hitParticles) {
      this.scene.hitParticles.explode(15, this.x, this.y - 100);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = statePlayer.dead;
      this.setVelocityX(0);
      this.play(this.textureKey + "_death");
      return;
    }

    this.state = statePlayer.hitstun;
    this.play(this.textureKey + "_hit");

    const knockbackDir = this.x < attackerX ? -1 : 1;
    this.setVelocityX(200 * knockbackMultiplier * knockbackDir);
    this.setVelocityY(-200 * knockbackMultiplier);

    this.once("animationcomplete", () => {
      if (this.state !== statePlayer.dead) {
        this.state = statePlayer.idle;
        this.play(this.textureKey + "_idle", true);
        this.clearTint();
        if (this.baseColor) this.setTint(this.baseColor);
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
