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
import {extjswrapper} from "./ExtJSWrapper.js";


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

		this.goFilterPanel = new go.filter.FilterPanel({
			entity: entityName,
			store: store
		})
		this.items.add(
			extjswrapper({comp: this.goFilterPanel},//somehow an extra comp is needed for the ext toolbar to resize properly

			)
			);

		this.on("render", () => {


			this.goFilterPanel.on("filterchange", (_p:any, filter:any) => {
				this.fire("filterchange", {filter});
			})

			this.goFilterPanel.on("variablefilterchange", (_p:any, filter:any) => {
				this.fire("variablefilterchange", {filter});
			})

		});
	}
}


export const filterpanel = (config: Config<FilterPanel, "entityName"|"store">) => createComponent(new FilterPanel(config.entityName,config.store), config);