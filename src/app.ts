import { Application, Text } from "pixi.js";

//将默认分辨率和自动分辨率设置为false
Text.defaultResolution = 2;
//设置默认的自动分辨率为false
Text.defaultAutoResolution = false;

export const app = new Application<HTMLCanvasElement>({
    backgroundColor: 0xffffff,
    backgroundAlpha: 0,
    resolution: 2, //分辨率设置为2不容易有锯齿
});
