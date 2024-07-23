import { Container, NineSlicePlane, Texture } from "pixi.js";
import gsap from "gsap";

import { navigation } from "../utils/navigation";
import { bgm } from "../utils/audio";
import { sleep } from "../utils/sleep";
import { LargeButton } from "../ui/LargeButton";
import { registerCustomEase } from "../utils/animation";
import { Logo } from "../ui/Logo";
import { Dragon } from "../ui/Dragon";
import { RippleButton } from "../ui/RippleButton";

import { GameScreen } from "./GameScreen";

/** 自定义缓动曲线，用于底部动画以显示屏幕 */
const easeSoftBackOut = registerCustomEase(
    "M0,0,C0,0,0.05,0.228,0.09,0.373,0.12,0.484,0.139,0.547,0.18,0.654,0.211,0.737,0.235,0.785,0.275,0.864,0.291,0.896,0.303,0.915,0.325,0.944,0.344,0.97,0.356,0.989,0.38,1.009,0.413,1.039,0.428,1.073,0.604,1.074,0.72,1.074,0.822,1.035,0.91,1.011,0.943,1.002,1,1,1,1",
);

/** 加载后显示的第一个屏幕 */
export class HomeScreen extends Container {
    /** 此屏幕需要的资源包 */
    public static assetBundles = ["home", "common"];
    /** 游戏 logo */
    private logo: Logo;
    /** 动画龙 */
    private dragon: Dragon;
    /** 引导到游戏的按钮 */
    private playButton: LargeButton;
    /** 打开信息面板的按钮 */
    private infoButton: RippleButton;
    /** 打开设置面板的按钮 */
    private settingsButton: RippleButton;
    /** 底部基础，用于过渡 */
    private base: NineSlicePlane;

    constructor() {
        super();

        this.logo = new Logo();
        this.addChild(this.logo);

        this.dragon = new Dragon();
        this.dragon.playIdle();
        this.addChild(this.dragon);

        this.base = new NineSlicePlane(
            Texture.from("rounded-rectangle"),
            32,
            32,
            32,
            32,
        );
        this.base.tint = 0x2c136c;
        this.addChild(this.base);

        this.infoButton = new RippleButton({
            image: "icon-info",
            ripple: "icon-info-stroke",
        });
        this.infoButton.onPress.connect(() =>
            window.open("https://juejin.cn/post/7264471246662172727", "_blank"),
        );
        this.addChild(this.infoButton);

        this.settingsButton = new RippleButton({
            image: "icon-settings",
            ripple: "icon-settings-stroke",
        });
        this.settingsButton.onPress.connect(() => {
            // TODO: 打开设置面板
        });
        this.addChild(this.settingsButton);

        this.playButton = new LargeButton({ text: "开始游戏" });
        this.playButton.onPress.connect(() =>
            navigation.showScreen(GameScreen),
        );
        this.addChild(this.playButton);
    }

    /** 调整屏幕大小，窗口大小改变时触发 */
    public resize(width: number, height: number) {
        this.dragon.x = width * 0.5;
        this.dragon.y = height * 0.5;
        this.playButton.x = width * 0.5;
        this.playButton.y = height - 130;
        this.base.width = width;
        this.base.y = height - 140;
        this.logo.x = width * 0.5;
        this.logo.y = height * 0.2;
        // this.githubButton.x = width - 50;
        // this.githubButton.y = height - 40;
        this.infoButton.x = 30;
        this.infoButton.y = 30;
        this.settingsButton.x = width - 30;
        this.settingsButton.y = 30;
    }

    /** 显示屏幕并带有动画 */
    public async show() {
        bgm.play("common/bgm-main.mp3", { volume: 0.7 });

        // 重置视觉状态，隐藏稍后会显示的内容
        this.playButton.hide(false);
        this.infoButton.hide(false);
        this.settingsButton.hide(false);
        this.dragon.show(false);
        this.logo.show(false);

        // 播放显示动画
        this.playRevealAnimation();

        // 按顺序显示剩余组件
        await sleep(500);
        await this.playButton.show();
        this.interactiveChildren = true;
        this.infoButton.show();
        await this.settingsButton.show();
    }

    /** 隐藏屏幕并带有动画 */
    public async hide() {
        this.playButton.hide();
        this.infoButton.hide();
        await sleep(100);
        gsap.to(this.base.pivot, { y: -200, duration: 0.3, ease: "back.in" });
        await sleep(100);
        this.logo.hide();
        await sleep(100);
        await this.dragon.hide();
    }

    /** 显示屏幕后面的动画 */
    private async playRevealAnimation() {
        const duration = 1;
        const ease = easeSoftBackOut;

        gsap.killTweensOf(this.base);
        gsap.killTweensOf(this.base.pivot);

        // 使平面颜色基础覆盖整个屏幕，匹配加载屏幕的视觉状态
        this.base.height = navigation.height * 1.25;
        this.base.pivot.y = navigation.height;

        // 动画从屏幕底部开始逐渐显示
        gsap.to(this.base, {
            height: 200,
            duration,
            ease,
        });
        await gsap.to(this.base.pivot, {
            y: 0,
            duration,
            ease,
        });
    }
}
