import { Container } from "pixi.js";

import { Match3Config, match3GetConfig } from "./Match3Config";
import { Match3Timer } from "./Match3Timer";
import { Match3Board } from "./Match3Board";
import { Match3Actions } from "./Match3Actions";
import { Match3Process } from "./Match3Process";
import { Match3Position, Match3Type } from "./Match3Utility";
import { Match3Piece } from "./Match3Piece";
import { Match3Stats } from "./Match3Stats";
import { Match3Special } from "./Match3Special";

/** Interface for onMove event data */
export interface Match3OnMoveData {
    /** The starting grid position of the move */
    from: Match3Position;
    /** The ending grid position of the move */
    to: Match3Position;
    /** True if is a valid movement (creates a match) */
    valid: boolean;
}

/** Interface for onMatch event data */
export interface Match3OnMatchData {
    /** List of all matches detected in the grid */
    matches: Match3Position[][];
    /** Combo level - starting from 1 */
    combo: number;
}

/** Interface for onPop event data */
export interface Match3OnPopData {
    /** The type of the piece popped out */
    type: Match3Type;
    /** The piece sprite */
    piece: Match3Piece;
    /** Current combo level */
    combo: number;
    /** Tells if the given type is a special type */
    isSpecial: boolean;
    /** True if the piece was popped from special effect, not plain match */
    causedBySpecial: boolean;
}

/**
 * The main match3 class that sets up game's sub-systems and provide some useful callbacks.
 * All game events are set as plain callbacks for simplicity
 */
export class Match3 extends Container {
    /** Match3 game basic configuration */
    public config: Match3Config;
    /** Counts the gameplay time */
    public timer: Match3Timer;
    /** Fires when game duration expires */
    public onTimesUp?: () => void;
    /** Holds the grid state and display */
    public board: Match3Board;
    /** Sort out actions that the player can take */
    public actions: Match3Actions;
    /** Process matches and fills up the grid */
    public process: Match3Process;
    /** Fires when the game finishes auto-processing the grid */
    public onProcessComplete?: () => void;
    /** Fires when player move pieces */
    public onMove?: (data: Match3OnMoveData) => void;
    /** Fires when a match is detected */
    public onMatch?: (data: Match3OnMatchData) => void;
    /** Fires when a piece is popped out of the board */
    public onPop?: (data: Match3OnPopData) => void;
    /** Compute score, grade, number of matches */
    public stats: Match3Stats;
    /** Handles pieces with special powers */
    public special: Match3Special;

    constructor() {
        super();

        // Game sub-systems
        this.config = match3GetConfig();
        this.timer = new Match3Timer(this); // 计时模块
        this.board = new Match3Board(this); // 棋盘模块
        this.actions = new Match3Actions(this); // 玩家操作（移动,点击）模块
        this.process = new Match3Process(this); // 处理消除的过程
        this.stats = new Match3Stats(this); // 游戏分数模块
        this.special = new Match3Special(this); // 特殊元素
    }

    /**
     * Sets up a new match3 game with pieces, rows, columns, duration, etc.
     * @param config The config object in which the game will be based on
     */
    public setup(config: Match3Config) {
        this.config = config;
        this.reset();
        this.board.setup(config);
        this.timer.setup(config.duration * 1000);
    }

    /** Fully reset the game */
    public reset() {
        this.interactiveChildren = false;
        this.timer.reset();
    }

    /** Start the timer and enable interaction */
    public startPlaying() {
        this.interactiveChildren = true;
        this.timer.start();
    }

    /** Stop the timer and disable interaction */
    public stopPlaying() {
        this.interactiveChildren = false;
    }

    /** Check if the game is still playing */
    public isPlaying() {
        return this.interactiveChildren;
    }

    /** Pause the game */
    public pause() {
        this.timer.pause();
    }

    /** Resume the game */
    public resume() {
        this.timer.resume();
    }

    /** Update the timer */
    public update(detlaMs: number) {
        this.timer.update(detlaMs);
    }
}
