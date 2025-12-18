function walkStraight() {}

function crouch() {}

function walkBack() {}

function jump() {}

window.addEventListener("keydown", function(event)) {
    if (event.key === "ArrowUp") {
        jump();
    }
    if (event.key === "ArrowDown") {
        crouch();
    }
}