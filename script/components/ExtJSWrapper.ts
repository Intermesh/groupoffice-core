import {Component, createComponent, FunctionUtil, Config} from "@intermesh/goui";

export class ExtJSWrapper extends Component {
	constructor(public readonly extJSComp:any, proxies : string[] = []) {
		super();

		this.items.add(extJSComp);

		proxies.forEach(p => {
			// @ts-ignore
			this[p] = extJSComp[p].bind(extJSComp);
		})

		let ro : ResizeObserver | undefined;
		this.on("attach", () => {
			ro = new ResizeObserver(FunctionUtil.onRepaint( () => {

				if(this.extJSComp && !this.extJSComp.isDestroyed) {
					this.extJSComp.setWidth(Component.remToPx(this.width));
					this.extJSComp.setHeight(Component.remToPx(this.height));
					if(this.extJSComp.doLayout) {
						this.extJSComp.doLayout();
					}
				}
			}));

			ro.observe(this.el);
		}).on("detach", () => {
			if(ro) {
				ro.disconnect();
				ro = undefined;
			}
		})
	}

	cascade(fn: (comp: Component) => (boolean | void)) {
		//super.cascade(fn);
	}
}

export const extjswrapper = (config: Config<ExtJSWrapper> & {comp:any, proxies?:string[]}, ...items: Component[]) => createComponent(new ExtJSWrapper(config.comp, config.proxies ?? []), config, items);
