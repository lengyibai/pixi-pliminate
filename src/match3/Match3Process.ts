import { AsyncQueue } from "../utils/asyncUtils";

import { Match3 } from "./Match3";
import {
    match3ApplyGravity,
    match3FillUp,
    match3GetEmptyPositions,
    match3GetMatches,
    match3GetPieceType,
    match3GridToString,
} from "./Match3Utility";

/**
 * Sort out the gameplay progression on the board after a player action, clearing matches
 * then filling up empty spaces. The process is organised in 'process rounds' that will keep
 * going until there are no new matches neither empty spaces left in the grid.
 *
 * The process round steps are sequenced in a queue of async functions to keep things simple,
 * in a way each step can be awaited/delayed as needed acording to what makes sense to the game flow.
 */
export class Match3Process {
    /** The Match3 instance */
    private match3: Match3;
    /** Tells if it is currently processing or not */
    private processing = false;
    /** The subsequent process round, resets when process starts */
    private round = 0;
    /** The list of queued actions that the grid processing will take */
    private queue: AsyncQueue;

    constructor(match3: Match3) {
        this.match3 = match3;
        this.queue = new AsyncQueue();
    }
    /** Start processing the grid until there are no new matches or empty spaces left */
    public async start() {
        if (this.processing || !this.match3.isPlaying()) return;
        this.processing = true;
        this.round = 0;
        console.log(
            `%c[Match3] ======= PROCESSING START ==========`,
            "color: green",
        );
        this.runProcessRound();
    }
    /**
     * Sequence of logical steps to evolve the board, added to the async queue. Each step can
     * be awaited/delayed as needed in oder to create a nice gameplay progress flow.
     */
    private async runProcessRound() {
        // Step #1 - Bump sequence number and update stats with new matches found
        this.queue.add(async () => {
            this.round += 1;
            this.updateStats();
        });

        // Step #2 - Process and clear all special matches
        this.queue.add(async () => {
            await this.processSpecialMatches();
        });

        // Step #3 - Process and clear remaining common matches
        this.queue.add(async () => {
            await this.processRegularMatches();
        });

        // Step #4 - Move down remaining pieces in the grid if there are empty spaces in their columns
        this.queue.add(async () => {
            // No await here, to make it run simultaneously with grid refill
            /* await */ this.applyGravity();
        });

        // Step #5 - Create new pieces that falls from the to to fill up remaining empty spaces
        this.queue.add(async () => {
            await this.refillGrid();
        });

        // Step #6 - Finish up this sequence round and check if it needs a re-run, otherwise stop processing
        this.queue.add(async () => {
            this.processCheckpoint();
        });
    }
    /** Update gameplay stats with new matches found in the grid */
    private async updateStats() {
        const matches = match3GetMatches(this.match3.board.grid);
        if (!matches.length) return;
        console.log("[Match3] Update stats", matches);
        const matchData = { matches, combo: this.getProcessRound() };
        this.match3.stats.registerMatch(matchData); // 根据matches计算并更新分数
        this.match3.onMatch?.(matchData); // 添加音效等
    }
    /** Get current process round */
    public getProcessRound() {
        return this.round;
    }
    /** Sort out special matches in the grid */
    private async processSpecialMatches() {
        console.log("[Match3] Process special matches");
        await this.match3.special.process();
    }
    /** Clear all matches in the grid */
    private async processRegularMatches() {
        console.log("[Match3] Process regular matches");
        const matches = match3GetMatches(this.match3.board.grid);
        const animPromises: Promise<void>[] = [];
        for (const match of matches) {
            const promises = this.match3.board.popPieces(match);
            animPromises.push(promises);
        }
        await Promise.all(animPromises);

        console.log(
            "Grid after processRegularMatches:\n" +
                match3GridToString(this.match3.board.grid),
        );
    }
    /** Make existing pieces fall in the grid if there are empty spaces below them */
    private async applyGravity() {
        // match3ApplyGravity will update grid
        const changes = match3ApplyGravity(this.match3.board.grid);
        console.log(
            "[Match3] Apply gravity - should fall in pieces:",
            changes
                .map(
                    (c) =>
                        `from${c[0].row}:${c[0].column}to${c[1].row}:${c[1].column}`,
                )
                .join(" "),
        );
        console.log(
            "Grid after applyGravity:\n" +
                match3GridToString(this.match3.board.grid),
        );

        const animPromises: Promise<void>[] = [];

        for (const change of changes) {
            const from = change[0];
            const to = change[1];
            const piece = this.match3.board.getPieceByPosition(from);
            if (!piece) {
                continue;
            }
            piece.row = to.row;
            piece.column = to.column;
            const newPosition =
                this.match3.board.getViewPositionByGridPosition(to);
            animPromises.push(piece.animateFall(newPosition.x, newPosition.y));
        }
        await Promise.all(animPromises);
    }
    /** Fill up empty spaces in the grid with new pieces falling from the top */
    private async refillGrid() {
        const emptyPositions = match3FillUp(
            this.match3.board.grid,
            this.match3.board.commonTypes,
        );
        console.log("[Match3] Refill grid - new pieces:", emptyPositions);
        console.log(
            "Grid after FillUp:\n" + match3GridToString(this.match3.board.grid),
        );
        const animPromises: Promise<void>[] = [];
        const piecesPerColumn: Record<number, number> = {};

        for (const position of emptyPositions) {
            const pieceType = match3GetPieceType(
                this.match3.board.grid,
                position,
            );
            const piece = this.match3.board.createPiece(position, pieceType);

            // Count pieces per column so new pieces can be stacked up accordingly
            if (!piecesPerColumn[piece.column])
                piecesPerColumn[piece.column] = 0;
            piecesPerColumn[piece.column] += 1;

            const x = piece.x;
            const y = piece.y;
            const columnCount = piecesPerColumn[piece.column];
            const height = this.match3.board.getHeight();
            // -height/2即棋盘上边缘的y坐标,每个piece的初始y坐标与目标y坐标垂直对称,对称轴是棋盘上边缘
            piece.y = -height / 2 - columnCount * this.match3.config.tileSize;

            animPromises.push(piece.animateFall(x, y));
        }
        await Promise.all(animPromises);
    }
    /** Check the grid if there are empty spaces and/or matches remaining, and run another process round if needed */
    private async processCheckpoint() {
        // Check if there are any remaining matches or empty spots
        const newMatches = match3GetMatches(this.match3.board.grid);
        const emptySpaces = match3GetEmptyPositions(this.match3.board.grid);
        console.log("[Match3] Checkpoint - New matches:", newMatches.length);
        console.log("[Match3] Checkpoint - Empty spaces:", emptySpaces.length);
        if (newMatches.length || emptySpaces.length) {
            console.log("[Match3] Checkpoint - Another sequence run is needed");
            // Run it again if there are any new matches or empty spaces in the grid
            this.runProcessRound();
        } else {
            console.log("[Match3] Checkpoint - Nothing left to do, all good");
            // Otherwise, finish the grid processing
            this.end();
        }
    }
    /** Clear process query and stop processing the grid */
    public async end() {
        if (!this.processing) return;
        this.processing = false;
        this.queue.clear();
        console.log("[Match3] Sequence rounds:", this.round);
        // console.log('[Match3] Board pieces:', this.match3.board.pieces.length);
        console.log(
            "[Match3] Final Grid:\n" +
                match3GridToString(this.match3.board.grid),
        );
        console.log(
            "%c[Match3] ======= PROCESSING COMPLETE =======",
            "color: green",
        );
        this.match3.onProcessComplete?.();
    }
    /** Check if is processing */
    public isProcessing() {
        return this.processing;
    }
}
