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
    duration: 300,
    animSuffix: "_attack1",
    shake: { intensity: 0.002, duration: 100 },
    hitStop: 30,
    bloodCount: 15, // Peu de sang
    bloodSpeed: 200, // Vitesse modérée
  },
  mid: {
    damage: 10,
    range: 280,
    duration: 500,
    animSuffix: "_attack2",
    shake: { intensity: 0.008, duration: 150 },
    hitStop: 60,
    bloodCount: 40, // Quantité moyenne
    bloodSpeed: 400,
  },
  heavy: {
    damage: 15,
    range: 320,
    duration: 800,
    animSuffix: "_attack2",
    shake: { intensity: 0.01, duration: 250 },
    hitStop: 120,
    bloodCount: 120, // "Boucherie" : gicle partout !
    bloodSpeed: 800, // Vitesse élevée pour l'effet "projection"
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

  update(keys, opponent, pad) {
    if (this.state === statePlayer.dead) {
      this.setVelocityX(0);
      return;
    }

    const threshold = 0.5;

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

    // Si on attaque, on ne peut rien faire d'autre (Cooldown)
    if (this.state === statePlayer.attack) return;

    if (
      Phaser.Input.Keyboard.JustDown(keys.lowattack) ||
      (pad && pad.X && !this.prevPadA)
    ) {
      this.executeAttack("low");
      this.play(this.textureKey + "_attack1", true);

      if (this.scene.katanaSounds) {
        this.scene.katanaSounds.low.play();
      }
      return;
    } else if (
      Phaser.Input.Keyboard.JustDown(keys.midattack) ||
      (pad && pad.A && !this.prevPadX)
    ) {
      this.executeAttack("mid");
      this.play(this.textureKey + "_attack2", true);

      if (this.scene.katanaSounds) {
        this.scene.katanaSounds.mid.play();
      }
      return;
    } else if (
      Phaser.Input.Keyboard.JustDown(keys.heavyattack) ||
      (pad && pad.B && !this.prevPadB)
    ) {
      this.executeAttack("heavy");
      this.play(this.textureKey + "_attack2", true);

      if (this.scene.katanaSounds) {
        this.scene.katanaSounds.heavy.play();
      }
      return;
    }

    const walkSpeed = 300;
    const walkBackSpeed = 200;

    if (Phaser.Input.Keyboard.JustDown(keys.dash) && !this.indash) {
      this.indash = true;
      let dash = 0;
      if (
        keys.left.isDown ||
        (pad && (pad.left || pad.leftStick.x < -threshold))
      ) {
        dash = this.x < opponent.x ? -walkBackSpeed * 3 : -walkSpeed * 3;
      } else if (
        keys.right.isDown ||
        (pad && (pad.right || pad.leftStick.x > threshold))
      ) {
        dash = this.x > opponent.x ? walkBackSpeed * 3 : walkSpeed * 3;
      }
      if (dash !== 0) {
        this.setVelocityX(dash);
        this.scene.time.delayedCall(200, () => {});
      }
    }

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

    if (
      (keys.up.isDown && isGrounded) ||
      (pad && (pad.up || pad.leftStick.y < -threshold) && isGrounded)
    ) {
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
    const offset = bodyHalfWidth + attackHalfWidth;
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

        // --- HIT STOP NERVEUX ---
        const stopDuration = config.hitStop || 50;

        // On fige uniquement les animations et les vitesses
        const oldVelocitySelf = this.body.velocity.clone();
        const oldVelocityEnemy = enemy.body.velocity.clone();

        this.anims.pause();
        enemy.anims.pause();
        this.body.setAllowGravity(false);
        enemy.body.setAllowGravity(false);
        this.setVelocity(0, 0);
        enemy.setVelocity(0, 0);

        // On utilise le temps réel du navigateur (setTimeout) pour être indépendant de Phaser
        setTimeout(() => {
          if (this.active && enemy.active) {
            this.anims.resume();
            enemy.anims.resume();
            this.body.setAllowGravity(true);
            enemy.body.setAllowGravity(true);

            // On applique les dégâts et le recul APRES la pause pour le feeling
            enemy.takeDamage(config.damage, this.x, type);
          }
        }, stopDuration);

        // --- SHAKE (Lui ne freeze jamais) ---
        if (config.shake) {
          this.scene.cameras.main.shake(
            config.shake.duration,
            config.shake.intensity
          );
        }
      }
    });

    // Nettoyage standard
    this.once("animationcomplete", () => {
      if (this.state === statePlayer.attack)
        this.play(this.textureKey + "_idle", true);
    });

    this.scene.time.delayedCall(config.duration, () => {
      if (hitbox.active) hitbox.destroy();
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

    const config = dataAttack[attackType];
    const attacker =
      this === this.scene.player1 ? this.scene.player2 : this.scene.player1;

    // --- FLASH DE DOULEUR (Sur le personnage) ---
    this.setTintFill(0xffffff);
    this.setAlpha(0.5);

    this.scene.time.delayedCall(100, () => {
      this.clearTint();
      this.setAlpha(1);
      if (this.baseColor) {
        this.setTint(this.baseColor);
      }
    });

    // --- LOGIQUE DE BLOCAGE ---
    let knockbackMultiplier = 1.0;
    if (this.state === statePlayer.block) {
      amount = Math.floor(amount * 0.2);
      knockbackMultiplier = 0.3;
      if (attacker) {
        attacker.setVelocityX(this.x < attackerX ? 400 : -400);
      }
    }

    // Application des dégâts
    this.hp -= amount;

    if (attackType === "heavy" && this.state !== statePlayer.block) {
      // flash(durée, rouge, vert, bleu, intensité)
      this.scene.cameras.main.flash(100, 255, 255, 255, 0.5);
    }

    // --- GESTION DU SANG ---
    if (this.scene.hitParticles) {
      // On fait exploser au niveau du torse visuel
      // Puisque le sprite est grand (scale 3.5), on monte de 100 à 150 pixels depuis les pieds
      const bloodY = this.y - 350;
      const bloodX = this.x;

      this.scene.hitParticles.explode(20, bloodX, bloodY);
    }

    // --- LOGIQUE MORT ---
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = statePlayer.dead;
      this.setVelocityX(0);
      this.play(this.textureKey + "_death");
      return;
    }

    // --- HITSTUN (Recul physique) ---
    this.state = statePlayer.hitstun;
    this.play(this.textureKey + "_hit");

    const kbForce =
      attackType === "heavy" ? 200 : attackType === "mid" ? 100 : 50;
    const knockbackDir = this.x < attackerX ? -1 : 1;

    this.setVelocityX(kbForce * knockbackMultiplier * knockbackDir);
    this.setVelocityY(-100 * knockbackMultiplier);

    // Sortie de hitstun
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
