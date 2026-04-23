import {
	avatar,
	checkbox,
	checkboxcolumn,
	column,
	datasourcestore,
	DataSourceStore,
	EntityID, HiddenField,
	t,
	Table
} from "@intermesh/goui";
import {principalDS} from "../../../auth/index.js";
import {img} from "../../../jmap/index.js";

export class GroupUserTable extends Table<DataSourceStore> {
	constructor(private hiddenField:HiddenField) {
		super(
			datasourcestore({
				queryParams: {limit: 20},
				dataSource: principalDS,
				filters: {
					entity: {entity: "User"},
				},
				sort: [{
					property: "name"
				}],
				onBeforeLoad: async (records) => {
					return records;
				}
			}),
			[
				column({
					sortable: false,
					resizable: false,
					width: 64,
					id: "avatarId",
					sticky: true,
					renderer: (avatarId, record, td) => {

						return avatarId ?
							img({
								cls: "goui-avatar",
								style: {cursor: "pointer"},
								blobId: avatarId
							}) :
							avatar({
								style: {cursor: "pointer"},
								displayName: record.name
							})
					}
				}),
				column({
					header: t("Name"),
					id: "name",
					sortable: true,
					htmlEncode: false, // disable html encoding as we will use html in the renderer. Make sure to encode the data in there.
					renderer: (columnValue, record, td, table1, storeIndex) => {

						// 2 line rendering
						return `<h3>${record.name.htmlEncode()}</h3> <h4>${record.email.htmlEncode()}</h4>`
					}
				}),
				column({
					id: "selected",
					width: 50,
					renderer: (columnValue, record, td, table, storeIndex, column1) => {
						const selectedIds = this.hiddenField.value as Array<EntityID> ?? [];
						return checkbox({
							value: selectedIds.indexOf(record.id) > -1,
							listeners: {
								change: ({newValue}) => {
									let selectedIds = this.hiddenField.value as Array<EntityID> ?? [];
									if(newValue) {
										selectedIds.push(record.id);
									} else {
										selectedIds = selectedIds.filter(id => id != record.id);
									}

									this.hiddenField.value = selectedIds;
								}
							}
						})
					}
				})

			]
		);

		this.scrollLoad = true;

		this.rowSelectionConfig = {multiSelect: true};

		this.headers = false;

		this.fitParent = true;
	}
}