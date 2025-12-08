import {btn, checkboxselectcolumn, column, datasourcestore, menu, t, Table} from "@intermesh/goui";
import {JmapDataSource} from "../../jmap/index.js";
import {AclLevel} from "../../auth/index.js";
import {FilterDialog} from "./FilterDialog.js";

export class FilterGrid extends Table {
	constructor(entityName: string) {
		const store = datasourcestore({
			dataSource: EntityFilterDS,
			queryParams: {
				limit: 0
			},
			filters: {
				base: {
					entity: entityName,
					type: 'fixed'
				}
			}
		});

		const columns = [
			checkboxselectcolumn({
				id: "checkbox"
			}),
			column({
				id: "name",
				header: t("Name")
			}),
			column({
				id: "btn",
				width: 48,
				sticky: true,
				renderer: (columnValue: any, record, td, table, rowIndex) => {
					return btn({
						icon: "more_vert",
						menu: menu({},
							btn({
								icon: "edit",
								text: t("Edit"),
								handler: () => {
									const entityFilter = table.store.get(rowIndex)!;

									const dlg = new FilterDialog(entityName);
									dlg.load(entityFilter.id);
									dlg.show();
								},
								disabled: record.permissionLevel < AclLevel.MANAGE
							}),
							btn({
								icon: "delete",
								text: t("Delete"),
								handler: () => {
									const entityFilter = table.store.get(rowIndex)!;
									EntityFilterDS.confirmDestroy([entityFilter.id]);
								},
								disabled: record.permissionLevel < AclLevel.MANAGE
							})
						)
					})
				}
			})
		];

		super(store, columns);


		this.headers = false;
		this.fitParent = true;
		this.emptyStateHtml = "";
		this.cls = "no-row-lines";
	}
}

export const EntityFilterDS = new JmapDataSource("EntityFilter");