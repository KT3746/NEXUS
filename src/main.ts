import "./style.css";
import { Game } from "./game/game";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("App root missing");
const game = new Game(app);
game.start();
