import {
	btn,
	comp,
	Component,
	ComponentEventMap,
	Config,
	createComponent,
	DataSourceStore,
	Filter,
	h3,
	menu,
	t,
	tbar
} from "@intermesh/goui";
import {FilterGrid} from "./FilterGrid.js";
import {FilterDialog} from "./FilterDialog.js";
import {VariableFilterDialog} from "./VariableFilterDialog.js";
import {VariableFilterGrid} from "./VariableFilterGrid.js";


/**
 * @inheritDoc
 */
export interface FilterPanelEventMap extends ComponentEventMap {
	filterchange: { filter: Filter }
	variablefilterchange: { filter: Filter }
}

export class FilterPanel extends Component<FilterPanelEventMap> {
	private filterGrid: FilterGrid;
	private variableFilterGrid: VariableFilterGrid;
	private readonly filterStore: DataSourceStore | undefined;

	constructor(public readonly entityName: string, public readonly store?: DataSourceStore) {
		super();

		if (store) {
			this.filterStore = store;
		}

		this.items.add(
			tbar({
					cls: "border-bottom"
				},
				h3({text: t("Filters")}),
				'->',
				btn({
					icon: "add",
					menu: menu({},
						btn({
							text: t("Filter"),
							icon: "filter_alt",
							handler: () => {
								const dlg = new FilterDialog(entityName);
								dlg.show();
							}
						}),
						btn({
							text: t("Input field"),
							icon: "search",
							handler: () => {
								const dlg = new VariableFilterDialog(entityName);
								dlg.show();
							}
						})
					)
				})
			),
			comp({cls: "scroll", flex: 1},
				this.filterGrid = new FilterGrid(entityName)
			),
			comp({cls: "scroll", flex: 1},
				this.variableFilterGrid = new VariableFilterGrid(entityName)
			)
		);

		this.filterGrid.store.load();
		this.variableFilterGrid.store.load();

		this.filterGrid.rowSelectionConfig = {
			listeners: {
				selectionchange: ({selected}) => {

					const filter: Filter = {
						operator: "AND",
						conditions: []
					}

					selected.forEach((s) => {
						filter.conditions!.push(s.record.filter);
					});

					if (this.filterStore) {
						this.filterStore.setFilter("user", filter);

						void this.filterStore.load();
					}

					this.fire("filterchange", {filter: filter});
				}
			}
		};

		this.variableFilterGrid.on("variablefiltersetvalue", ({filter, value}) => {
			const newFilter: Filter = {
				operator: "AND",
				conditions: []
			};

			this.variableFilterGrid.filterValues.forEach((fv) => {
				newFilter.conditions!.push({[fv.filter.name]: fv.value});
			});

			if (this.filterStore) {
				this.filterStore.setFilter("customfilters", newFilter);

				void this.filterStore.load();
			}

			this.fire("variablefilterchange", ({filter: filter}));
		});
	}
}


export const filterpanel = (config: Config<FilterPanel, "entityName" | "store">) => createComponent(new FilterPanel(config.entityName, config.store), config);