import { Container } from "pixi.js";

import { app } from "../app";

import { areBundlesLoaded, loadBundles } from "./assets";
import { pool } from "./pool";

/** 应用程序屏幕的接口 */
interface AppScreen extends Container {
    /** 显示前准备屏幕 */
    prepare?(): void;
    /** 调整屏幕大小 */
    resize?(width: number, height: number): void;
    /** 更新屏幕，传递时间增量/步长 */
    update?(delta: number): void;
    /** 显示屏幕 */
    show?(): Promise<void>;
    /** 隐藏屏幕 */
    hide?(): Promise<void>;
    /** 隐藏后重置屏幕 */
    reset?(): void;
}

/** 应用程序屏幕构造函数的接口 */
interface AppScreenConstructor {
    new (): AppScreen;
    /** 屏幕所需的资源包列表 */
    assetBundles?: string[];
}

class Navigation {
    /** 包含屏幕的容器 */
    public container = new Container();

    /** 应用程序宽度 */
    public width = 0;

    /** 应用程序高度 */
    public height = 0;

    /** 所有屏幕的背景视图 */
    public background?: AppScreen;

    /** 当前显示的屏幕 */
    public currentScreen?: AppScreen;

    constructor() {
        this.container.name = "navigation";
    }

    /** 设置默认加载屏幕 */
    public setBackground(ctor: AppScreenConstructor) {
        this.background = new ctor();
        this.background.name = "background";
        this.addAndShowScreen(this.background);
    }

    /** 将屏幕添加到舞台，链接更新和调整大小函数 */
    private async addAndShowScreen(screen: AppScreen) {
        // 如果导航容器还没有父级，则将其添加到舞台
        if (!this.container.parent) {
            app.stage.addChild(this.container);
        }

        // 将屏幕添加到舞台
        this.container.addChild(screen);

        // 在显示前准备和预组织屏幕
        if (screen.prepare) {
            screen.prepare();
        }

        // 如果有调整大小处理程序，则添加
        if (screen.resize) {
            // 触发首次调整大小
            screen.resize(this.width, this.height);
        }

        // 如果有更新函数，则添加
        if (screen.update) {
            app.ticker.add(screen.update, screen);
        }

        // 显示新屏幕
        if (screen.show) {
            screen.interactiveChildren = false;
            await screen.show();
            screen.interactiveChildren = true;
        }
    }

    /** 从舞台移除屏幕，取消链接更新和调整大小函数 */
    private async hideAndRemoveScreen(screen: AppScreen) {
        // 禁止屏幕交互
        screen.interactiveChildren = false;

        // 如果有隐藏方法，则隐藏屏幕
        if (screen.hide) {
            await screen.hide();
        }

        // 如果有更新方法，则取消链接更新函数
        if (screen.update) {
            app.ticker.remove(screen.update, screen);
        }

        // 从父级移除屏幕（通常是 app.stage，除非已更改）
        if (screen.parent) {
            screen.parent.removeChild(screen);
        }

        // 清理屏幕，以便稍后可以重新使用实例
        if (screen.reset) {
            screen.reset();
        }
    }

    /**
     * 隐藏当前屏幕（如果有）并显示新屏幕。
     * 任何符合 AppScreen 接口的类都可以在这里使用。
     */
    public async showScreen(ctor: AppScreenConstructor) {
        // 禁止当前屏幕的交互
        if (this.currentScreen) {
            this.currentScreen.interactiveChildren = false;
        }

        // 加载新屏幕的资源（如果有）
        if (ctor.assetBundles && !areBundlesLoaded(ctor.assetBundles)) {
            // 加载此新屏幕所需的所有资源
            await loadBundles(ctor.assetBundles);
        }

        // 如果已经有屏幕，则隐藏并销毁它
        if (this.currentScreen) {
            await this.hideAndRemoveScreen(this.currentScreen);
        }

        // 创建新屏幕并将其添加到舞台
        this.currentScreen = pool.get(ctor);
        await this.addAndShowScreen(this.currentScreen);
    }

    /**
     * 调整屏幕大小
     * @param width 视口宽度
     * @param height 视口高度
     */
    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.currentScreen?.resize?.(width, height);
        this.background?.resize?.(width, height);
    }
}

/** 共享的导航实例 */
export const navigation = new Navigation();
