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
    // Temps pendant lequel le joueur est bloqué (Cooldown)
    duration: 400,
    animSuffix: "_attack1",
  },
  mid: {
    damage: 10,
    range: 140,
    duration: 600,
    animSuffix: "_attack2",
  },
  heavy: {
    damage: 15,
    range: 160,
    // Grosse attaque = Gros temps de blocage (900ms)
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

    // --- SCALE & HITBOX (Sprites 200x200) ---
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

    // --- SECURITE KNOCKBACK ---
    // Si on est en hitstun, on ne touche PAS à la vélocité, on laisse la physique faire.
    if (this.state === statePlayer.hitstun) return;

    const isGrounded = this.body.touching.down;

    // On ne met à zéro que si on n'est pas en train d'être repoussé par un blocage
    // ou si on est dans un état contrôlable.
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

    // Si on attaque, on ne peut rien faire d'autre (Cooldown)
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

    // 1. On lance l'animation
    this.play(this.textureKey + config.animSuffix);

    // 2. Hitbox
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

    // --- C'EST ICI QUE ÇA CHANGE ---

    // A. Événement VISUEL : Quand l'animation du coup est finie...
    this.once("animationcomplete", () => {
      // Si on est toujours vivant et pas stun...
      if (this.state === statePlayer.attack) {
        // ... On se remet visuellement en position d'attente (Idle)
        // CA ÉVITE L'EFFET LAGGY / STATUE
        this.play(this.textureKey + "_idle", true);
      }
    });

    // B. Événement LOGIQUE : Quand le Cooldown est fini...
    this.scene.time.delayedCall(config.duration, () => {
      if (hitbox.active) hitbox.destroy();

      // On rend le contrôle au joueur SEULEMENT maintenant
      if (
        this.state !== statePlayer.dead &&
        this.state !== statePlayer.hitstun
      ) {
        this.state = statePlayer.idle;
        // On est sûr d'être en idle
        this.play(this.textureKey + "_idle", true);
      }
    });
  }

  takeDamage(amount, attackerX) {
    if (this.state === statePlayer.dead) return;

    const attacker =
      this === this.scene.player1 ? this.scene.player2 : this.scene.player1;
    let knockbackMultiplier = 1.0;

    // --- LOGIQUE DE BLOCAGE ---
    if (this.state === statePlayer.block) {
      amount = Math.floor(amount * 0.2); // Dégâts réduits à 20%
      knockbackMultiplier = 0.5; // La victime reculera moins (0.5x)

      // L'ATTAQUANT PREND LE RECUL (1.5x)
      if (attacker) {
        const attackerPushDir = this.x < attackerX ? 1 : -1;
        attacker.setVelocityX(200 * 1.5 * attackerPushDir);

        // Petit flash blanc sur l'attaquant pour le feedback du contre
        attacker.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => attacker.clearTint());
      }
    }

    // Application des dégâts
    this.hp -= amount;

    // Particules (position ajustée)
    if (this.scene.hitParticles) {
      this.scene.hitParticles.explode(15, this.x, this.y - 100);
    }

    // --- LOGIQUE MORT ---
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = statePlayer.dead;
      this.setVelocityX(0);
      this.play(this.textureKey + "_death");
      return;
    }

    // --- LOGIQUE HITSTUN (Victime) ---
    this.state = statePlayer.hitstun;
    this.play(this.textureKey + "_hit");

    const knockbackDir = this.x < attackerX ? -1 : 1;
    // On applique le multiplier (0.5 si block, 1.0 sinon)
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
