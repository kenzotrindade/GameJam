this.timeLeft = 99;
this.timerText = this.add
  .text(400, 50, "99", { fontSize: "64px", fill: "#fff" })
  .setOrigin(0.5);

this.time.addEvent({
  delay: 1000,
  callback: () => {
    if (this.timeLeft > 0 && !this.gameOver) {
      this.timeLeft--;
      this.timerText.setText(this.timeLeft);
    } else if (this.timeLeft === 0) {
      this.checkWinner();
    }
  },
  callbackScope: this,
  loop: true,
});

checkWinner() {
  if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();

    let winnerText = "";
    if (this.player1.hp > this.player2.hp) winnerText = "P1 GAGNE !";
    else if (this.player2.hp > this.player1.hp) winnerText = "P2 GAGNE !";
    else winnerText = "MATCH NUL";

    this.add.text(400, 300, winnerText, { fontSize: '80px', fill: '#f00' }).setOrigin(0.5);
    this.add.text(400, 400, "Appuyez sur R pour rejouer", { fontSize: '20px' }).setOrigin(0.5);

    this.input.keyboard.once('keydown-R', () => {
        this.scene.restart();
    });
}
