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

const dataAttack = {
  low: {
    damage: 5,
    range: 240,
    duration: 400,
    hitdelay: 150,
    animSuffix: "_attack1",
    shake: { intensity: 0.002, duration: 100 },
    hitStop: 30,
    bloodCount: 15,
    bloodSpeed: 200,
  },
  mid: {
    damage: 10,
    range: 280,
    duration: 500,
    hitdelay: 195,
    animSuffix: "_attack2",
    shake: { intensity: 0.008, duration: 150 },
    hitStop: 60,
    bloodCount: 40,
    bloodSpeed: 400,
  },
  heavy: {
    damage: 15,
    range: 320,
    duration: 900,
    hitdelay: 240,
    animSuffix: "_attack2",
    shake: { intensity: 0.01, duration: 250 },
    hitStop: 120,
    bloodCount: 120,
    bloodSpeed: 800,
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

  update(keys, opponent, pad) {
    if (this.state === statePlayer.dead) {
      this.setVelocityX(0);
      return;
    }

    var dash = false;
    const threshold = 0.5;

    // --- SECURITE KNOCKBACK ---
    // Si on est en hitstun, on ne touche PAS à la vélocité, on laisse la physique faire.
    if (this.state === statePlayer.hitstun) return;

    const isGrounded = this.body.touching.down;

    if (this.state !== statePlayer.attack) {
      this.setVelocityX(0);
    }

    let dashIntensity = 0;

    if (pad && pad.R2) {
      dash = true;
      dashIntensity = pad.R2 * 100 * 4;
    } else if (keys.dash.isDown) {
      dash = true;
      dashIntensity = 400;
    }

    const walkSpeed = 300 + dashIntensity;
    const walkBackSpeed = 200 + dashIntensity;

    // --- ANIMATIONS ---
    if (this.state !== statePlayer.attack) {
      if (!isGrounded) {
        if (this.body.velocity.y < 0) {
          this.play(this.textureKey + "_jump", true);
        } else {
          this.play(this.textureKey + "_fall", true);
        }
      } else {
        if (
          keys.left.isDown ||
          (pad && (pad.left || pad.leftStick.x < -threshold)) ||
          keys.right.isDown ||
          (pad && (pad.right || pad.leftStick.x > threshold))
        ) {
          this.play(this.textureKey + "_run", true);
        } else {
          this.play(this.textureKey + "_idle", true);
        }
      }
    }

    if (this.state === statePlayer.attack) return;

    if (
      keys.left.isDown ||
      (pad && (pad.left || pad.leftStick.x < -threshold))
    ) {
      if (this.x < opponent.x) {
        this.setVelocityX(-walkBackSpeed);
        this.state = statePlayer.block;
      } else {
        this.setVelocityX(-walkSpeed);
        this.state = statePlayer.walk;
      }
    } else if (
      keys.right.isDown ||
      (pad && (pad.right || pad.leftStick.x > threshold))
    ) {
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

    if (dash === true) return;

    if (
      (keys.up.isDown && isGrounded) ||
      (pad && (pad.up || pad.leftStick.y < -threshold) && isGrounded)
    ) {
      this.setVelocityY(-1500);
      this.state = statePlayer.jump;
    }

    if (
      Phaser.Input.Keyboard.JustDown(keys.lowattack) ||
      (pad && pad.X && !this.prevPadX)
    ) {
      this.executeAttack("low");
      return;
    } else if (
      Phaser.Input.Keyboard.JustDown(keys.midattack) ||
      (pad && pad.A && !this.prevPadA)
    ) {
      this.executeAttack("mid");
      return;
    } else if (
      Phaser.Input.Keyboard.JustDown(keys.heavyattack) ||
      (pad && pad.B && !this.prevPadB)
    ) {
      this.executeAttack("heavy");
      return;
    } /*else if (
      Phaser.Input.Keyboard.JustDown(keys.specialattack) ||
      (pad && pad.Y && !this.prevPadY)
    ) {
      this.executeAttack("special");
      return;
    }*/
  }

  executeAttack(type) {
    const config = dataAttack[type];
    if (this.scene.katanaSounds && this.scene.katanaSounds[type]) {
      this.scene.katanaSounds[type].play();
    }
    this.state = statePlayer.attack;
    this.setVelocityX(0);
    this.play(this.textureKey + config.animSuffix);

    this.scene.time.delayedCall(config.hitdelay || 0, () => {
      if (this.state !== statePlayer.attack) return;
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

      let hasHit = false;

      this.scene.physics.overlap(hitbox, enemy, () => {
        if (
          !hasHit &&
          enemy.state !== statePlayer.hitstun &&
          enemy.state !== statePlayer.dead
        ) {
          hasHit = true;

          const stopDuration = config.hitStop || 50;

          this.anims.pause();
          enemy.anims.pause();
          this.body.setAllowGravity(false);
          enemy.body.setAllowGravity(false);
          this.setVelocity(0, 0);
          enemy.setVelocity(0, 0);

          this.scene.time.delayedCall(stopDuration, () => {
            if (this.active && enemy.active) {
              this.anims.resume();
              enemy.anims.resume();
              this.body.setAllowGravity(true);
              enemy.body.setAllowGravity(true);

              enemy.takeDamage(config.damage, this.x, type);
            }
          });

          if (config.shake) {
            this.scene.cameras.main.shake(
              config.shake.duration,
              config.shake.intensity
            );
          }
        }
      });
      this.scene.time.delayedCall(dataAttack[type].duration, () => {
        if (hitbox.active) hitbox.destroy();
      });
    });

    this.once("animationcomplete", () => {
      if (this.state === statePlayer.attack)
        this.play(this.textureKey + "_idle", true);
    });

    this.scene.time.delayedCall(config.duration, () => {
      if (
        this.state !== statePlayer.dead &&
        this.state !== statePlayer.hitstun
      ) {
        this.state = statePlayer.idle;
      }
    });
  }

  takeDamage(amount, attackerX, attackType = "low") {
    if (this.state === statePlayer.dead) return;

    let knockbackMultiplier = 1;

    const config = dataAttack[attackType];
    const attacker =
      this === this.scene.player1 ? this.scene.player2 : this.scene.player1;

    this.setTintFill(0xffffff);
    this.setAlpha(0.5);

    this.scene.time.delayedCall(100, () => {
      this.clearTint();
      this.setAlpha(1);
      if (this.baseColor) {
        this.setTint(this.baseColor);
      }
    });

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

    if (attackType === "heavy" && this.state !== statePlayer.block) {
      this.scene.cameras.main.flash(100, 255, 255, 255, 0.5);
    }

    if (this.scene.hitParticles) {
      const bloodY = this.y - 350;
      const bloodX = this.x;
      this.scene.hitParticles.explode(20, bloodX, bloodY);
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

    const kbForce =
      attackType === "heavy" ? 200 : attackType === "mid" ? 100 : 50;
    const knockbackDir = this.x < attackerX ? -1 : 1;

    this.setVelocityX(200 * knockbackMultiplier * knockbackDir);
    this.setVelocityY(-200 * knockbackMultiplier);

    this.scene.time.delayedCall(config.duration * 0.5, () => {
      if (this.state !== statePlayer.dead) {
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
    this.setFlipX(this.x > opponent.x);
    this.direction = this.x > opponent.x ? -1 : 1;
  }
}
