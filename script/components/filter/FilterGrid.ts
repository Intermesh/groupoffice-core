import {btn, checkboxselectcolumn, column, datasourcestore, menu, menucolumn, t, Table} from "@intermesh/goui";
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
			menucolumn({
				menu: menu({
						listeners: {
							show: ({target}) => {
								const record = store.get(target.dataSet.rowIndex)!;

								target.findChild("edit")!.disabled = record.permissionLevel < AclLevel.MANAGE;
								target.findChild("delete")!.disabled = record.permissionLevel < AclLevel.MANAGE;
							}
						}
					},
					btn({
						itemId: "edit",
						icon: "edit",
						text: t("Edit"),
						handler: (btn) => {
							const entityFilter = store.get(btn.parent!.dataSet.rowIndex)!;

							const dlg = new FilterDialog(entityName);
							dlg.load(entityFilter.id);
							dlg.show();
						},
					}),
					btn({
						itemId: "delete",
						icon: "delete",
						text: t("Delete"),
						handler: (btn) => {
							const entityFilter = store.get(btn.parent!.dataSet.rowIndex)!;
							EntityFilterDS.confirmDestroy([entityFilter.id]);
						},
					})
				)
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