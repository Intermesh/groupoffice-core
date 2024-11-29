import {
	comp,
	Component,
	ComponentEventMap,
	Config,
	createComponent,
	Filter,
	FunctionUtil, Listener, ObservableListenerOpts,
	Store
} from "@intermesh/goui";


/**
 * @inheritDoc
 */
export interface FilterPanelEventMap<Type> extends ComponentEventMap<Type> {

	filterchange: (button: Type, filter: Filter) => false | void


	variablefilterchange: (button: Type, filter: Filter) => false | void,

}

export interface FilterPanel extends Component {
	on<K extends keyof FilterPanelEventMap<this>, L extends Listener>(eventName: K, listener: Partial<FilterPanelEventMap<this>>[K], options?: ObservableListenerOpts): L
	un<K extends keyof FilterPanelEventMap<this>>(eventName: K, listener: Partial<FilterPanelEventMap<this>>[K]): boolean
	fire<K extends keyof FilterPanelEventMap<this>>(eventName: K, ...args: Parameters<FilterPanelEventMap<any>[K]>): boolean
}
export class FilterPanel extends Component {
	private goFilterPanel: any;
	constructor(public readonly entityName:string, public readonly store?:Store) {
		super();

		this.items.add(
			comp({},//somehow an extra comp is needed for the ext toolbar to resize properly
					this.goFilterPanel = new go.filter.FilterPanel({
					entity: entityName,
					store: store
				})
			)
			);

		this.on("render", () => {
			const ro = new ResizeObserver(FunctionUtil.onRepaint( () => {
				this.goFilterPanel.setWidth(this.el.offsetWidth);
			}));

			this.goFilterPanel.on("filterchange", (_p:any, filter:any) => {
				this.fire("filterchange", this, filter);
			})

			this.goFilterPanel.on("variablefilterchange", (_p:any, filter:any) => {
				this.fire("variablefilterchange", this, filter);
			})

			ro.observe(this.el);
		});
	}
}


export const filterpanel = (config: Config<FilterPanel, FilterPanelEventMap<FilterPanel>, "entityName"|"store">) => createComponent(new FilterPanel(config.entityName,config.store), config);