import { Player } from "../entities/player";    

this.currentPlayer =1;

const select ={
    p1: null,
    p2: null,
}; 

const stateSelect = {
  null: 0,
  p1: 1,
  p2: 2,
};
const selectPlayer = {
  red: {
    skin: "RedProtector",
    image: "RedProtector",
    state: stateSelect.null,
  },
  emerald: {
    skin: "EmeraldProtector",
    image: "EmeraldProtector",
    state: stateSelect.null,
  },
  blue: {
    skin: "BlueProtector",
    image: "BlueProtector",
    state: stateSelect.null,
  },
  yellow: {
    skin: "YellowProtector",
    image: "YellowProtector",
    state: stateSelect.null,
  },
  purple: {
    skin: "PurpleProtector",
    image: "PurpleProtector",
    state: stateSelect.null,
  },
};

if (stateSelect === stateSelect.null) {
}
