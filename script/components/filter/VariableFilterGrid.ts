import {
	btn,
	column,
	datasourcestore, EntityID,
	Filter,
	ListEventMap,
	menu,
	menucolumn,
	store,
	Store,
	t,
	Table
} from "@intermesh/goui";
import {EntityFilterDS} from "./FilterGrid.js";
import {VariableFilterDialog} from "./VariableFilterDialog.js";
import {entities, Entity} from "../../Entities.js";
import {VariableStringFilter} from "./variabletypes/VariableStringFilter.js";
import {VariableNumberFilter} from "./variabletypes/VariableNumberFilter.js";
import {VariableDateFilter} from "./variabletypes/VariableDateFilter.js";
import {VariableSelectFilter} from "./variabletypes/VariableSelectFilter.js";
import {VariableLinkFilter} from "./variabletypes/VariableLinkFilter.js";
import {VariableComponentFilter} from "./variabletypes/VariableComponentFilter.js";
import {EntityFilter} from "../../Modules.js";


export interface VariableFilterGridEventMap extends ListEventMap {
	variablefiltersetvalue: {value:any }
}

export class VariableFilterGrid extends Table<Store, VariableFilterGridEventMap> {
	private readonly entity: Entity;
	public filterValues: Record<EntityID, any> = {};


	constructor(entityName: string) {
		const store = datasourcestore({
			dataSource: EntityFilterDS,
			queryParams: {
				limit: 0
			},
			filters: {
				base: {
					entity: entityName,
					type: "variable"
				}
			}
		});

		const columns = [
			column({
				id: "name",
				renderer: (columnValue, record, td, table, storeIndex) => {
					const filter = this.entity.filters[columnValue];

					let filterField;

					switch (filter.type) {
						case "string":
							filterField = new VariableStringFilter(filter);
							break;
						case "number":
							filterField = new VariableNumberFilter(filter);
							break;
						case "date":
							filterField = new VariableDateFilter(filter);
							break;
						case "select":
							filterField = new VariableSelectFilter(filter);
							break;
						case "link":
							filterField = new VariableLinkFilter(filter);
							break;
						default:

							// type could be a Component class
							filterField = new VariableComponentFilter(filter);

					}

					if (filterField) {
						filterField.valueField.on("setvalue", ({newValue}:{newValue:any}) => {
							// const existingIndex = this.filterValues.findIndex(fv => fv.filter === filter);
							//
							// if (filter.type == "link") {
							// 	if (newValue.length) {
							// 		newValue = {operator: "OR", conditions: newValue.map((v:any) => { return {link: v}; })}
							// 	} else {
							// 		newValue = undefined;
							// 	}
							// }
							//
							// if (existingIndex !== -1) {
							// 	this.filterValues[existingIndex].value = newValue;
							// } else {
							// 	this.filterValues.push({filter: filter, value: newValue});
							// }

							this.filterValues[record.id] = newValue;

							this.fire("variablefiltersetvalue", ({value: Object.values(this.filterValues)}));

						});
					}

					return filterField;
				}
			}),
			menucolumn({
				menu: menu({},
					btn({
						icon: "edit",
						text: t("Edit"),
						handler: (btn) => {
							const record = store.get(btn.parent!.dataSet.rowIndex)!;
							const dlg = new VariableFilterDialog(entityName);

							void dlg.load(record.id);

							dlg.show();
						}
					}),
					btn({
						icon: "delete",
						text: t("Delete"),
						handler: (btn) => {
							const record = store.get(btn.parent!.dataSet.rowIndex)!;

							void EntityFilterDS.confirmDestroy([record.id]);
						}
					})
				)
			})
		];

		super(store, columns);

		this.headers = false;
		this.fitParent = true;
		this.emptyStateHtml = "";
		this.cls = "no-row-lines";

		this.entity = entities.get(entityName);
	}
}