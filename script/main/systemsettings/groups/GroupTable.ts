import {
	avatar, browserStoreConnection, btn,
	column,
	datasourcestore,
	DataSourceStore,
	datetimecolumn, menu, menucolumn,
	numbercolumn, store,
	t,
	Table, Window
} from "@intermesh/goui";
import {Group, groupDS, Principal, principalDS, User, userDS} from "../../../auth/index.js";
import {client, img} from "../../../jmap/index.js";
import {SettingsWindow} from "../../settings/index.js";
import {customFields} from "../../../customfields/index.js";
import {GroupDialog} from "./GroupDialog.js";

export class GroupTable extends Table<DataSourceStore> {
	constructor() {
		super(
			datasourcestore({
				queryParams: {limit: 20},
				dataSource: groupDS,
				sort: [{
					property: "name"
				}],
				filters: {
					default: {
						hideUsers: true
					}
				},
				onBeforeLoad: async (records) => {
					// load a max of 5 member usernames for each group
					await Promise.all(records.map(async (r:any) => {
						r.userCount = r.users.length;
						r.users = (await principalDS.get(r.users.slice(0, 5))).list;
					}));
					return records;
				}
			}),
			[
				column({
					header: t("Name"),
					id: "name",
					sortable: true,
					htmlEncode: false, // disable html encoding as we will use html in the renderer. Make sure to encode the data in there.
					renderer: (name, record, td, table1, storeIndex) => {
						// 2 line rendering
						let memberStr = record.users.map((u:Principal) => u.name).join(", ")
						const more = record.userCount - 5
						if(more > 0) {
							memberStr += t(" and {count} more").replace('{count}', more);
						}

						return `<h3>${name.htmlEncode()}</h3> <h4>${memberStr}</h4>`
					},
					width: 200
				}),

				menucolumn({
					menu: menu({},
						btn({
							icon: "edit",
							text: t("Edit"),
							handler: (b) => {
								const rowIndex = b.parent!.dataSet.rowIndex;
								this.edit(rowIndex)
							}
						}),

						"-",

						btn({
							icon: "delete",
							text: t("Delete")
						})
						)
				})
			]
		);

		this.scrollLoad = true;

		this.rowSelectionConfig = {multiSelect: true};

		this.on("rowdblclick", async ({target, storeIndex}) => {
			this.edit(storeIndex);
		});

		this.on("delete", async ({target}) => {
			const ids = this.rowSelection!.getSelected()!.map(row => row.record.id);

			await groupDS.confirmDestroy(ids);
		});

		this.fitParent = true;
	}

	private edit(rowIndex: number) {
		const win = new GroupDialog();
		win.load((this.store.get(rowIndex) as Group).id);
		win.show();
	}
}