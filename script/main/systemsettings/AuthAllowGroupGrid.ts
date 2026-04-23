import {
	BaseEntity,
	btn,
	column, ComboBoxDefaultRenderer, createComponent,
	DataSourceStore,
	datasourcestore,
	fieldset,
	hr,
	menu,
	t,
	Table,
	textfield
} from "@intermesh/goui";
import {groupcombo} from "../../components/GroupCombo.js";
import {JmapDataSource, jmapds} from "../../jmap/index.js";
import {FormWindow, PrincipalCombo, PrincipalComboConfig} from "../../components/index.js";
import {groupDS} from "../../auth/index.js";

interface AuthAllowGroup extends BaseEntity {
	groupId: string;
	group?: {
		id: string;
		name: string;
	};
	ipPattern: string;
}

export class AuthAllowGroupGrid extends Table<DataSourceStore<JmapDataSource<AuthAllowGroup>, AuthAllowGroup>> {

	constructor() {
		const store = datasourcestore({
			dataSource: jmapds<AuthAllowGroup>("AuthAllowGroup"),
			queryParams: {
				limit: 50
			},
			relations: {
				group: {
					dataSource: groupDS,
					path: "groupId"
				}
			}
		});

		const columns = [
			column({
				id: "group",
				header: t("Group"),
				resizable: true,
				sortable: false,
				renderer: (columnValue, record: AuthAllowGroup) => {
					return record.group ? record.group.name : "";
				}
			}),
			column({
				id: "ipPattern",
				header: t("IP pattern"),
				resizable: true,
				width: 200,
				sortable: false
			}),
			column({
				width: 48,
				id: "actions",
				sticky: true,
				renderer: (columnValue: any, record: AuthAllowGroup, td, table, rowIndex) => {
					return btn({
						icon: "more_vert",
						menu: menu({},
							btn({
								icon: "edit",
								text: t("Edit"),
								handler: async () => {
									const item = this.store.get(rowIndex)!;
									await this.editItem(item);
								}
							}),
							hr(),
							btn({
								icon: "delete",
								text: t("Delete"),
								handler: async () => {
									const item = table.store.get(rowIndex)!;
									if (item.id) {
										await jmapds("AuthAllowGroup").confirmDestroy([item.id]);
									}
								}
							})
						)
					});
				}
			})
		];

		super(store, columns);

		this.fitParent = true;
		this.rowSelectionConfig = {
			multiSelect: false
		};


		this.on("render", () => {
			store.load();
		})
	}

	private async editItem(item: Partial<AuthAllowGroup>) {
		const dialog = new AuthAllowGroupDialog();

		if (item.id) {
			await dialog.load(item.id);
		} else {
			dialog.form.value = item;
		}

		dialog.show();
	}

	public addNew() {
		this.editItem({
			groupId: "",
			ipPattern: ""
		});
	}
}

class AuthAllowGroupDialog extends FormWindow {
	constructor() {
		super("AuthAllowGroup");

		this.title = t("Allowed group");
		this.width = 400;
		this.closable = true;

		this.generalTab.items.add(
			fieldset({},
				groupcombo({
					name: "groupId",
					required: true
				}),
				textfield({
					name: "ipPattern",
					label: t("IP pattern"),
					required: true,
					hint: t("Use '*' to match any characters and '?' to match any single character. eg. '192.168.1?.*'")
				})
			)
		);
	}
}



export const authallowgroupgrid = (config?:PrincipalComboConfig) =>
	createComponent(new AuthAllowGroupGrid(),
		config);
