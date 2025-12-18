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
    range: 120,
    hitstuntDuration: 400,
    animSuffix: "_attack1", // Juste le suffixe !
  },
  mid: {
    damage: 10,
    range: 140,
    hitstuntDuration: 600,
    animSuffix: "_attack2",
  },
  heavy: {
    damage: 15,
    range: 160,
    hitstuntDuration: 900,
    animSuffix: "_attack2", // On recycle l'anim 2 pour le heavy
  },
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, color) {
    // textureKey sera "samurai"
    super(scene, x, y, textureKey + "_idle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.textureKey = textureKey; // On sauvegarde "samurai" pour plus tard

    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);

    // --- SCALE & HITBOX (Sprites 200x200) ---
    this.setScale(2.5);
    this.body.setSize(70, 80);
    this.body.setOffset(70, 75);

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

  // Petite méthode helper pour le restart
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
    if (this.state === statePlayer.dead) return;
    if (this.state === statePlayer.hitstun) return;

    const isGrounded = this.body.touching.down;
    this.setVelocityX(0);

    // --- ANIMATIONS DYNAMIQUES ---
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

    if (keys.left.isDown) {
      if (this.x < opponent.x) {
        this.setVelocityX(-walkBackSpeed);
        this.state = statePlayer.block; // Faudrait une anim de block un jour !
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
      this.setVelocityY(-800);
    }
  }

  executeAttack(type) {
    const config = dataAttack[type];
    this.state = statePlayer.attack;
    this.setVelocityX(0);

    // Construction du nom de l'anim : "samurai" + "_attack1"
    this.play(this.textureKey + config.animSuffix);

    const playerHalfWidth = this.displayWidth / 2;
    const hitboxHalfWidth = config.range / 2;
    const offset = playerHalfWidth * 0.6 + hitboxHalfWidth;

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

    this.once("animationcomplete", () => {
      hitbox.destroy();
      if (
        this.state !== statePlayer.dead &&
        this.state !== statePlayer.hitstun
      ) {
        this.state = statePlayer.idle;
        this.play(this.textureKey + "_idle", true);
      }
    });

    this.scene.time.delayedCall(config.hitstuntDuration, () => {
      if (hitbox.active) hitbox.destroy();
    });
  }

  takeDamage(amount, attackerX) {
    if (this.state === statePlayer.dead) return;
    if (this.state === statePlayer.block) amount = Math.floor(amount * 0.2);

    this.hp -= amount;

    if (this.scene.hitParticles) {
      this.scene.hitParticles.explode(10, this.x, this.y - 50);
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
    this.setVelocityX(200 * knockbackDir);
    this.setVelocityY(-200);

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
