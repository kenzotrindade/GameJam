import { startGame } from "./main.js";

let p1Choice = null;
let p2Choice = null;

// GESTION P1
document.querySelectorAll(".p1-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const char = e.target.dataset.char;
    console.log("TEST!");

    if (p1Choice) {
      unlockCharacterForPlayer("p2", p1Choice);
      document
        .querySelector(`.p1-btn[data-char="${p1Choice}"]`)
        .classList.remove("selected");
    }

    p1Choice = char;
    e.target.classList.add("selected");

    lockCharacterForPlayer("p2", char);
  });
});

// GESTION P2
document.querySelectorAll(".p2-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const char = e.target.dataset.char;

    if (p2Choice) {
      unlockCharacterForPlayer("p1", p2Choice);
      document
        .querySelector(`.p2-btn[data-char="${p2Choice}"]`)
        .classList.remove("selected");
    }

    p2Choice = char;
    e.target.classList.add("selected");

    lockCharacterForPlayer("p1", char);
  });
});

function lockCharacterForPlayer(playerTarget, charKey) {
  const btnToLock = document.querySelector(
    `.${playerTarget}-btn[data-char="${charKey}"]`
  );
  if (btnToLock) {
    btnToLock.classList.add("locked");
  }
}

function unlockCharacterForPlayer(playerTarget, charKey) {
  const btnToUnlock = document.querySelector(
    `.${playerTarget}-btn[data-char="${charKey}"]`
  );
  if (btnToUnlock) {
    btnToUnlock.classList.remove("locked");
  }
}

// START GAME
document.getElementById("startBtn").addEventListener("click", () => {
  if (p1Choice && p2Choice) {
    document.getElementById("htmlMenuOverlay").classList.add("hidden");
    startGame(p1Choice, p2Choice);
  } else {
    alert("Les deux joueurs doivent choisir !");
  }
});

// RESET DES CHOIX
window.addEventListener("reset-menu", () => {
  console.log("Nettoyage du menu...");

  p1Choice = null;
  p2Choice = null;

  document
    .querySelectorAll(".selected")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelectorAll(".locked")
    .forEach((el) => el.classList.remove("locked"));

  const menu = document.getElementById("htmlMenuOverlay");
  if (menu) {
    menu.classList.remove("hidden");
    menu.style.display = "flex";
  }
});
