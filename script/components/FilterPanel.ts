import {Component, ComponentEventMap, Config, createComponent, Store} from "@intermesh/goui";

export class FilterPanel extends Component {
	private goFilterPanel: any;
	constructor(public readonly entityName:string, public readonly store:Store) {
		super();

		this.items.add(this.goFilterPanel = new go.filter.FilterPanel({
			entity: entityName,
			store: store
		}))
	}
}


export const filterpanel = (config: Config<FilterPanel, ComponentEventMap<FilterPanel>, "entityName"|"store">) => createComponent(new FilterPanel(config.entityName,config.store), config);