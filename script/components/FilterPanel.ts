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
export interface FilterPanelEventMap extends ComponentEventMap {
	filterchange: {filter: Filter}
	variablefilterchange: {filter: Filter}

}
export class FilterPanel extends Component<FilterPanelEventMap> {
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
				this.fire("filterchange", {filter});
			})

			this.goFilterPanel.on("variablefilterchange", (_p:any, filter:any) => {
				this.fire("variablefilterchange", {filter});
			})

			ro.observe(this.el);
		});
	}
}


export const filterpanel = (config: Config<FilterPanel, "entityName"|"store">) => createComponent(new FilterPanel(config.entityName,config.store), config);