import "pixi-spine";
import { app } from "./app";
import { initAssets } from "./utils/assets";
import { navigation } from "./utils/navigation";
import { LoadScreen } from "./screens/LoadScreen";
import { TiledBackground } from "./ui/Background";
import { HomeScreen } from "./screens/HomeScreen";
import { GameScreen } from "./screens/GameScreen";
import { getUrlParam } from "./utils/getUrlParams";
import { ResultScreen } from "./screens/ResultScreen";

// 调整窗口大小时更新渲染器和导航屏幕的尺寸
function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const minWidth = 375;
    const minHeight = 700;

    // 计算缩放比例
    const scaleX = windowWidth < minWidth ? minWidth / windowWidth : 1;
    const scaleY = windowHeight < minHeight ? minHeight / windowHeight : 1;
    const scale = Math.max(scaleX, scaleY);

    const width = windowWidth * scale;
    const height = windowHeight * scale;

    // 更新画布样式尺寸并滚动窗口到顶部
    app.renderer.view.style.width = `${windowWidth}px`;
    app.renderer.view.style.height = `${windowHeight}px`;

    // 更新渲染器和导航屏幕的尺寸
    app.renderer.resize(width, height);
    navigation.resize(width, height);
}

// 初始化应用
async function init() {
    // 将画布元素添加到 body
    document.body.append(app.view);

    // 首次调整大小并监听窗口调整大小事件
    resize();
    window.addEventListener("resize", resize);

    // 加载资源
    await initAssets();

    // 关闭加载动画
    document.body.classList.add("loaded");

    // 添加所有屏幕共享的持久背景
    navigation.setBackground(TiledBackground);

    // 显示初始加载屏幕
    await navigation.showScreen(LoadScreen);

    // 根据 URL 参数跳转到指定屏幕
    if (getUrlParam("game") !== null) {
        await navigation.showScreen(GameScreen);
    } else if (getUrlParam("result") !== null) {
        await navigation.showScreen(ResultScreen);
    } else {
        await navigation.showScreen(HomeScreen);
    }
}

init();
