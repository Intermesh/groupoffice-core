import {btn, column, datasourcestore, Filter, ListEventMap, menu, menucolumn, Store, t, Table} from "@intermesh/goui";
import {EntityFilterDS} from "./FilterGrid.js";
import {VariableFilterDialog} from "./VariableFilterDialog.js";
import {entities, Entity} from "../../Entities.js";
import {VariableStringFilter} from "./variabletypes/VariableStringFilter.js";
import {VariableNumberFilter} from "./variabletypes/VariableNumberFilter.js";
import {VariableDateFilter} from "./variabletypes/VariableDateFilter.js";
import {VariableSelectFilter} from "./variabletypes/VariableSelectFilter.js";


export interface VariableFilterGridEventMap extends ListEventMap {
	variablefiltersetvalue: { filter: Filter, value: string }
}

export class VariableFilterGrid extends Table<Store, VariableFilterGridEventMap> {
	private readonly entity: Entity;
	public filterValues: { filter: Filter, value: string }[] = [];


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
					}

					if (filterField) {
						filterField.valueField.on("setvalue", ({newValue}) => {
							const existingIndex = this.filterValues.findIndex(fv => fv.filter === filter);

							if (existingIndex !== -1) {
								this.filterValues[existingIndex].value = newValue;
							} else {
								this.filterValues.push({filter: filter, value: newValue});
							}

							this.fire("variablefiltersetvalue", ({filter: filter, value: newValue}));
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