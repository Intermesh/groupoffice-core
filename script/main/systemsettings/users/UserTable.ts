import {
	avatar, browserStoreConnection, btn, Button,
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
import {UserSettingsWindow} from "../../settings/index.js";
import {customFields} from "../../../customfields/index.js";
import {modules} from "../../../Modules.js";

export class UserTable extends Table<DataSourceStore> {
	constructor() {
		let loginAsBtn: Button, archiveBtn: Button, deleteBtn: Button;

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
					minWidth: 200
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
						return authenticators.map((method:string) => `<i title="${method}" class="icon go-auth-method-${method}"></i>`).join(" ");
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
					menu: menu({
							listeners: {
								beforeshow: ({target}) => {
									const user = this.store.get(target.dataSet.rowIndex) as User | undefined;
									const isAdmin = client.user.isAdmin;
									loginAsBtn.disabled = !isAdmin || !user?.enabled;
									archiveBtn.disabled = !modules.get("core", "core")?.userRights.mayChangeUsers || user?.id == client.user.id;
									deleteBtn.disabled = !isAdmin;
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
						loginAsBtn = btn({
							icon: "swap_horiz",
							text: t("Login as this user"),
							handler: async (b) => {
								const rowIndex = b.parent!.dataSet.rowIndex;
								const user = this.store.get(rowIndex) as User;
								try {
									await browserStoreConnection.deleteDatabase();
									const result = await client.jmap("User/loginAs", {userId: user.id});
									if (!result.success) {
										void Window.error(t("Failed to login as this user"));
										return;
									}
								} catch (e) {
									void Window.error(e);
									return;
								}
								window.location.replace(BaseHref);
							}
						}),
						"-",
						archiveBtn = btn({
							icon: "archive",
							text: t("Archive user"),
							handler: async (b) => {
								const user = this.store.get(b.parent!.dataSet.rowIndex) as User;
								await this.archive(user);
							}
						}),
						deleteBtn = btn({
							icon: "delete",
							text: t("Delete"),
							handler: async (b) => {
								const user = this.store.get(b.parent!.dataSet.rowIndex) as User;
								try {
									await userDS.confirmDestroy([user.id]);
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
				await userDS.confirmDestroy(ids);
			} catch (e) {
				void Window.error(e);
			}
		});
	}

	/**
	 * Archive a user after confirmation. This disables the user, revokes all group memberships and makes their items
	 * invisible.
	 */
	private async archive(user: User) {
		if (user.id == client.user.id) {
			void Window.error(t("You can't archive yourself"));
			return;
		}

		if (!await Window.confirm(t("Archiving a user will disable them, revoke all group memberships and make their items invisible. Are you sure?"))) {
			return;
		}

		this.mask();
		try {
			await userDS.update(user.id, {enabled: false, archive: true});
		} catch (e) {
			void Window.error(e);
		} finally {
			this.unmask();
		}
	}

	private edit(rowIndex: number) {
		const win = new UserSettingsWindow(undefined, this.store.get(rowIndex) as User);
		win.show();
	}
}