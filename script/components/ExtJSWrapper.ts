import {Component, createComponent, FunctionUtil, Config} from "@intermesh/goui";

export class ExtJSWrapper extends Component {
	constructor(protected extJSComp:any, proxies : string[] = []) {
		super();

		this.items.add(extJSComp);

		proxies.forEach(p => {
			// @ts-ignore
			this[p] = extJSComp[p];
		})
		this.on("render", () => {
			const ro = new ResizeObserver(FunctionUtil.onRepaint( () => {

				if(this.extJSComp && !this.extJSComp.isDestroyed) {
					this.extJSComp.setWidth(Component.remToPx(this.width));
					this.extJSComp.setHeight(Component.remToPx(this.height));
					this.extJSComp.doLayout();
				}
			}));

			ro.observe(this.el);
		})
	}


	public static isExtJSComp(comp:any) {

	}
}

export const extjswrapper = (config: Config<ExtJSWrapper> & {comp:any, proxies?:string[]}, ...items: Component[]) => createComponent(new ExtJSWrapper(config.comp, config.proxies ?? []), config, items);
