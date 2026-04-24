import {
	avatar, browserStoreConnection, btn,
	column,
	datasourcestore,
	DataSourceStore,
	datetimecolumn, menu, menucolumn,
	numbercolumn,
	t,
	Table, Window
} from "@intermesh/goui";
import {User, userDS} from "../../../auth/index.js";
import {client, img} from "../../../jmap/index.js";
import {SettingsWindow} from "../../settings/index.js";
import {customFields} from "../../../customfields/index.js";

export class UserTable extends Table<DataSourceStore> {
	constructor() {
		super(
			datasourcestore({
				queryParams: {limit: 20},
				dataSource: userDS,
				sort: [{
					property: "username"
				}]
			}),
			[
				column({
					sortable: false,
					resizable: false,
					width: 64,
					id: "avatarId",
					sticky: true,
					renderer: (avatarId, record, td) => {

						if(!record.enabled)
						{
							td.attr("disabled", true);
						}

						return avatarId ?
							img({
								cls: "goui-avatar",
								style: {cursor: "pointer"},
								blobId: avatarId
							}) :
							avatar({
								style: {cursor: "pointer"},
								displayName: record.displayName
							})
					}
				}),
				column({
					header: t("Name"),
					id: "displayName",
					sortable: true,
					htmlEncode: false, // disable html encoding as we will use html in the renderer. Make sure to encode the data in there.
					renderer: (columnValue, record, td, table1, storeIndex) => {
						if(!record.enabled)
						{
							td.attr("disabled", true);
						}
						// 2 line rendering
						return `<h3>${record.displayName.htmlEncode()}</h3> <h4>${record.username.htmlEncode()}</h4>`
					},
					width: 200
				}),

				column({
					header: t("E-mail"),
					id: "email",
					sortable: true,
					width: 200
				}),

				datetimecolumn({
					header: t("Last login"),
					id: "lastLogin",
					sortable: true
				}),

				numbercolumn({
					header: t("Logins"),
					id: "loginCount",
					decimals: 0,
					sortable: true
				}),

				column({
					id: "authenticators",
					width: 100,
					sortable: false,
					htmlEncode: false,
					renderer: function(authenticators) {
						return authenticators.map((method:string) => `<i title="${method}" class="icon go-module-icon-${method}"></i>`).join(" ");
					}
				}),

				datetimecolumn({
					header: t("Created At"),
					id: "createdAt",
					sortable: true
				}),

				datetimecolumn({
					header: t("Modified At"),
					id: "modifiedAt",
					sortable: true
				}),
				...customFields.getTableColumns("User"),

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
						btn({
							icon: "swap_horiz",
							text: t("Login as"),
							handler: async (b) => {
								const rowIndex = b.parent!.dataSet.rowIndex;
								const user = this.store.get(rowIndex) as User;
								await browserStoreConnection.deleteDatabase();
								const result = await client.jmap("User/loginAs", {userId: user.id});
								if(!result.success) {
									void Window.error(t("Failed to login as this user"));
									return;
								}
								window.location.replace(BaseHref);
							}
						}),
						"-",
						btn({
							icon: "archive",
							text: t("Archive")
						}),
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

			await userDS.confirmDestroy(ids);
		});

		this.fitParent = true;
	}

	private edit(rowIndex: number) {
		const win = new SettingsWindow(undefined, this.store.get(rowIndex) as User);
		win.show();
	}
}