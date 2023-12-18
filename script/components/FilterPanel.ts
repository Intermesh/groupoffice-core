import {comp, Component, ComponentEventMap, Config, createComponent, FunctionUtil, Store} from "@intermesh/goui";

export class FilterPanel extends Component {
	private goFilterPanel: any;
	constructor(public readonly entityName:string, public readonly store:Store) {
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

			ro.observe(this.el);
		});
	}
}


export const filterpanel = (config: Config<FilterPanel, ComponentEventMap<FilterPanel>, "entityName"|"store">) => createComponent(new FilterPanel(config.entityName,config.store), config);