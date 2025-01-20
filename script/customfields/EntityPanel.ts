import {
	browser,
	btn,
	column, comp,
	Component,
	EntityID, menu, Notifier, Store,
	store,
	t,
	Table,
	table,
	tbar
} from "@intermesh/goui";
import {client, jmapds} from "../jmap/index.js";
import {FieldSetDialog} from "./FieldSetDialog.js";
import {entities} from "../Entities.js";
import {ExportDialog} from "./ExportDialog.js";
import {Text} from "./type/Text.js";

interface StoreEntity {
	name: string,
	databaseName?: string,
	type?: string,
	fieldId?: EntityID,
	fieldSetId?: EntityID,
	isFieldSet: boolean,
	sortOrder: number,
	aclId?: EntityID,
	permissionLevel: number
}

export class EntityPanel extends Component {
	private readonly store: Store<StoreEntity>
	private readonly table: Table
	private readonly entityName: string

	constructor(entityName: string) {
		super();

		this.entityName = entityName;

		this.store = store<StoreEntity>();

		this.table = table({
			fitParent: true,
			store: this.store,
			cls: "bg-lowest",
			columns: [
				column({
					id: "name",
					header: t("Name"),
					renderer: (value, record) => {
						return record.isFieldSet ? `<h5>${value}</h5>` : value;
					}
				}),
				column({
					id: "databaseName",
					header: t("Database name")
				}),
				column({
					id: "type",
					header: t("Type")
				}),
				column({
					id: "menu",
					width: 90,
					renderer: (value, record, td, table, rowIndex) => {
						const addBtn = btn({
							icon: "add",
							cls: "primary filled",
							// temporary code for menu handling
							menu: menu({
								isDropdown: true
							},
								btn({
									icon: "description",
									text: t("Text"),
									handler: () => {

										const textObject = new Text();
										const fieldDlg = textObject.getDialog();
										fieldDlg.show();
									}
								})
							)
						})

						const moreMenu = btn({
							icon: "more_vert",
							style: {float: "right"},
							menu: menu({},
								btn({
									icon: "edit",
									text: t("Edit"),
									handler: () => {
										if (record.isFieldSet) {
											const dlg = new FieldSetDialog();

											void dlg.load(record.fieldSetId);
											dlg.show();
										} else {

										}
									}
								}),
								btn({
									icon: "delete",
									text: t("Delete"),
									handler: (btn, ev) => {
										const idToDestroy = record.isFieldSet ? record.fieldSetId : record.fieldId;
										const typeToDestroy = record.isFieldSet ? "FieldSet" : "Field";

										jmapds(typeToDestroy).confirmDestroy([idToDestroy]).then(() => {
											void this.load();
										});
									}
								})
							)
						});

						return record.isFieldSet ? comp({height: 20}, addBtn, moreMenu) : moreMenu;
					}
				})
			]
		});

		this.items.add(
			tbar({},
				'->',
				btn({
					icon: "cloud_upload",
					title: t("Import fieldsets from JSON-file"),
					handler: async () => {
						const files = await browser.pickLocalFiles(false, false, '.json');
						const blob = await client.upload(files[0]);
						this.mask();

						client.jmap("FieldSet/importFromJson", {entity: this.entityName, blobId: blob.id}).then((response) => {
							this.unmask();
							this.load();
						}).catch((response) => {
							Notifier.error(response);
							this.unmask();
						})
					}
				}),
				btn({
					icon: "cloud_download",
					title: t("Export fieldsets to JSON-file"),
					handler: () => {
						const exportDlg = new ExportDialog();
						void exportDlg.load(entityName);
						exportDlg.show();
					}
				}),
				btn({
					cls: "primary filled",
					icon: "add",
					text: t("Add field set"),
					handler: () => {
						const fieldSetDlg = new FieldSetDialog();

						fieldSetDlg.form.value = {
							entity: entityName
						}

						fieldSetDlg.on("close", () => {
							void this.load();
						});

						fieldSetDlg.show();
					}
				})
			),
			this.table
		);
	}

	public async load() {
		const entity = await entities.get(this.entityName);

		const tableData: StoreEntity[] = [];

		const fieldSetIdsQueryResponse = await jmapds("FieldSet").query({filter: {entities: entity}});
		const fieldSetsQueryResponse = await jmapds("FieldSet").get(fieldSetIdsQueryResponse.ids);

		for (const fieldset of fieldSetsQueryResponse.list) {
			const fieldsetStoreEntity: StoreEntity = {
				name: fieldset.name,
				databaseName: undefined,
				type: undefined,
				fieldId: undefined,
				fieldSetId: fieldset.id,
				isFieldSet: true,
				sortOrder: fieldset.sortOrder,
				aclId: fieldset.aclId,
				permissionLevel: fieldset.permissionLevel
			};

			tableData.push(fieldsetStoreEntity);

			const fieldIdsQueryResponse = await jmapds("Field").query({filter: {fieldSetId: fieldset.id}})
			const fieldQueryResponse = await jmapds("Field").get(fieldIdsQueryResponse.ids);

			for (const field of fieldQueryResponse.list) {
				const fieldStoreEntity: StoreEntity = {
					name: field.name,
					databaseName: field.databaseName,
					type: field.type,
					fieldId: field.id,
					fieldSetId: undefined,
					isFieldSet: false,
					sortOrder: field.sortOrder,
					aclId: undefined,
					permissionLevel: fieldset.permissionLevel
				}

				tableData.push(fieldStoreEntity)
			}
		}

		this.store.clear();
		this.store.loadData(tableData);
	}
}