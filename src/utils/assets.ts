import { Assets, type AssetsManifest } from "pixi.js";

/** 捆绑分组的资源列表，用于动态加载 */
let assetsManifest: AssetsManifest = { bundles: [] };
/** 已经加载的存储捆绑包 */
const loadedBundles: string[] = [];

/** @description 加载尚未加载的资源 bundle */
export async function loadBundles(bundles: string | string[]) {
    typeof bundles === "string" && (bundles = [bundles]);

    //检查请求的 bundle 是否存在于资源清单中
    bundles.forEach((bundle) => {
        if (!assetsManifest.bundles.find((b) => b.name === bundle)) {
            throw new Error(`[Assets] Invalid bundle: ${bundle}`);
        }
    });

    //过滤掉已加载的 bundle
    const loadList = bundles.filter((bundle) => {
        return !loadedBundles.includes(bundle);
    });

    //如果没有需要加载的 bundle，则跳过加载
    if (!loadList.length) return;

    //加载 bundle
    console.trace("正在加载资源:", loadList);
    await Assets.loadBundle(loadList);

    //将已加载的 bundle 添加到已加载列表中
    loadedBundles.push(...loadList);
}

/** @description 检查所有指定的 bundle 是否已加载 */
export function areBundlesLoaded(bundles: string[]): boolean {
    return bundles.every((name) => loadedBundles.includes(name));
}

/** @description 初始化并开始后台加载所有资源 */
export const initAssets = async () => {
    assetsManifest = await (await fetch("assets/assets-manifest.json")).json();

    if (!assetsManifest.bundles) {
        throw new Error("[Assets] Invalid assets manifest");
    }
    console.log("资源清单：", assetsManifest.bundles);

    //使用此资源清单初始化 PixiJS 资源
    await Assets.init({
        manifest: assetsManifest,
        basePath: "assets",
    });

    //列出所有现有的 bundle 名称
    const allBundles = assetsManifest.bundles.map((item) => item.name);

    //开始后台加载所有 bundle
    Assets.backgroundLoadBundle(allBundles);
};
