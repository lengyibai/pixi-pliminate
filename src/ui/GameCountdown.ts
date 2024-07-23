import { Container } from "pixi.js";
import gsap from "gsap";

import { sleep } from "../utils/sleep";

import { Label } from "./Label";
import { Cloud } from "./Cloud";
// import { sfx } from '../utils/audio';

/**
 * The "Ready... GO!" message that shows up right before gameplay starts, that takes place of
 * a regular "3, 2, 1... GO!" animation, for speed.
 */
export class GameCountdown extends Container {
    /** Inner container for internal animations */
    private container: Container;
    /** The animated cloud background */
    private cloud: Cloud;
    /** The message displaying */
    private label: Label;

    constructor() {
        super();

        this.container = new Container();
        this.addChild(this.container);

        this.cloud = new Cloud({
            color: 0x0a0025,
            width: 400,
            height: 70,
            circleSize: 100,
        });
        this.container.addChild(this.cloud);

        this.label = new Label("", {
            fill: 0xffffff,
            fontSize: 70,
        });
        this.container.addChild(this.label);
        this.visible = false;
    }

    /** Play "Ready?" animation */
    private async playReadyAnimation() {
        // sfx.play('common/sfx-countdown.wav', { speed: 0.8, volume: 0.5 });
        gsap.killTweensOf(this.label);
        gsap.killTweensOf(this.label.scale);
        this.label.text = "Ready";
        this.label.scale.set(0);
        await gsap.to(this.label.scale, {
            x: 1,
            y: 1,
            duration: 0.7,
            ease: "back.out",
        });
    }

    /** Play "GO!" animation */
    private async playGoAnimation() {
        gsap.killTweensOf(this.label);
        gsap.killTweensOf(this.label.scale);
        await gsap.to(this.label, { alpha: 0, duration: 0.2, ease: "sine.in" });
        // sfx.play('common/sfx-countdown.wav', { speed: 1.2, volume: 0.5 });
        this.label.text = "Go";
        this.label.scale.set(0.8);
        gsap.to(this.label, { alpha: 1, duration: 0.2, ease: "linear" });
        gsap.to(this.label, {
            alpha: 0,
            duration: 0.2,
            ease: "linear",
            delay: 0.6,
        });
        await gsap.to(this.label.scale, {
            x: 3,
            y: 3,
            duration: 0.8,
            ease: "easeMidSlowMotion",
        });
    }

    /** Show up the countdown and play "Ready?" animation */
    public async show() {
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);
        this.visible = true;

        await Promise.all([
            this.playReadyAnimation(),
            this.cloud.playFormAnimation(0.7),
        ]);
    }

    /** Play "Go!" animation then hides the countdown */
    public async hide() {
        this.playGoAnimation();
        await sleep(600);
        await this.cloud.playDismissAnimation(0.7);
        this.visible = false;
    }
}
