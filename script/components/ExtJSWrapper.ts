import {Component, createComponent, FunctionUtil, Config} from "@intermesh/goui";

export class ExtJSWrapper extends Component {
	/**
	 * Constructor
	 *
	 * @param extJSComp
	 * @param proxies An array of methods that needs to be proxied onto the extjs component
	 */
	constructor(protected extJSComp:any, proxies : string[] = []) {
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

					if(this.syncWidth) {
						this.extJSComp.setWidth(Component.remToPx(this.width));
					}
					if(this.syncHeight) {
						this.extJSComp.setHeight(Component.remToPx(this.height));
					}

					this.extJSComp.doLayout();
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

	/**
	 * When the GOUI parent component's width changes then apply this to this component
	 */
	public syncWidth = true;

	/**
	 * When the GOUI parent component's height changes then apply this to this component.
	 *
	 * In some cases you might not want this because the ext component must have an "auto" height
	 */
	public syncHeight = true;


	/**
	 * Abort cascading into extjs components
	 * @param fn
	 */
	cascade(fn: (comp: Component) => (boolean | void)) {
		//super.cascade(fn);
	}

}


/**
 * GOUI Wrapper for Extjs component.
 *
 * When the GOUI component changes it applies it's new dimensions to the Extjs component.
 *
 * @param config
 * @param items
 */

export const extjswrapper = (config: Config<ExtJSWrapper> & {
	/**
	 * The ExtJS component
	 */
	comp:any,
	/**
	 * An array of methods that needs to be proxied onto the extjs component
	 */
	proxies?:string[]
}, ...items: Component[]) => createComponent(new ExtJSWrapper(config.comp, config.proxies ?? []), config, items);
