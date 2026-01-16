import {
	avatar,
	column,
	datasourcestore,
	DataSourceStore,
	datetimecolumn,
	numbercolumn,
	t,
	Table
} from "@intermesh/goui";
import {customFields} from "@intermesh/groupoffice-core";
import {userDS} from "../../../auth/index.js";
import {img} from "../../../jmap/index.js";

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
					renderer: (avatarId, record) => {
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
						// 2 line rendering
						return `<h3>${record.displayName.htmlEncode()}</h3> <h4>${record.username.htmlEncode()}</h4>`
					}
				}),

				column({
					header: t("E-mail"),
					id: "email",
					sortable: true
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




			].concat(...customFields.getTableColumns("User"))
		);

		this.scrollLoad = true;

		this.rowSelectionConfig = {multiSelect: true};

		this.on("rowdblclick", async ({target, storeIndex}) => {
			// const dlg = new NoteDialog();
			// dlg.show();
			// await dlg.load(target.store.get(storeIndex)!.id);
		});

		this.on("delete", async ({target}) => {
			const ids = this.rowSelection!.getSelected()!.map(row => row.record.id);

			await userDS.confirmDestroy(ids);
		});

		this.fitParent = true;
	}
}