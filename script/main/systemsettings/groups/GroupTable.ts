import {btn, Button, column, datasourcestore, DataSourceStore, menu, menucolumn, t, Table, Window} from "@intermesh/goui";
import {AclLevel, Group, groupDS, Principal, principalDS} from "../../../auth/index.js";
import {GroupDialog} from "./GroupDialog.js";

/**
 * The Administrators, Everyone and Internal groups. Their IDs are hard coded in the Group model and they can't be deleted.
 */
const SYSTEM_GROUP_MAX_ID = 3;

export class GroupTable extends Table<DataSourceStore> {
	constructor() {
		let deleteBtn: Button;

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

						return `<h3>${name.htmlEncode()}</h3> <h4>${memberStr.htmlEncode()}</h4>`
					},
					minWidth: 200
				}),

				menucolumn({
					menu: menu({
							listeners: {
								beforeshow: ({target}) => {
									const group = this.store.get(target.dataSet.rowIndex) as Group | undefined;
									deleteBtn.disabled = !group || !GroupTable.mayDelete(group);
								}
							}
						},
						btn({
							icon: "edit",
							text: t("Edit"),
							handler: (b) => {
								const rowIndex = b.parent!.dataSet.rowIndex;
								this.edit(rowIndex)
							}
						}),

						"-",

						deleteBtn = btn({
							icon: "delete",
							text: t("Delete"),
							handler: async (b) => {
								const group = this.store.get(b.parent!.dataSet.rowIndex) as Group;
								try {
									await groupDS.confirmDestroy([group.id]);
								} catch (e) {
									void Window.error(e);
								}
							}
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

			try {
				await groupDS.confirmDestroy(ids);
			} catch (e) {
				void Window.error(e);
			}
		});

	}

	/**
	 * The system groups can't be deleted and the user needs delete permission
	 */
	private static mayDelete(group: Group): boolean {
		return parseInt(group.id) > SYSTEM_GROUP_MAX_ID && group.permissionLevel >= AclLevel.DELETE;
	}

	private edit(rowIndex: number) {
		const win = new GroupDialog();
		win.load((this.store.get(rowIndex) as Group).id);
		win.show();
	}
}