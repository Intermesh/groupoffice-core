import {
	browser,
	btn,
	Button,
	column,
	comp,
	Component,
	EntityID,
	menu,
	Notifier,
	Store,
	store,
	t,
	Table,
	table,
	tbar
} from "@intermesh/goui";
import {client, JmapDataSource} from "../jmap/index.js";
import {FieldSetDialog} from "./FieldSetDialog.js";
import {ExportDialog} from "./ExportDialog.js";
import {fieldSetDS} from "../CustomFields.js";
import {fieldDS} from "./index.js";

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
					renderer: async (value, record, td, table, rowIndex) => {
						const menuButtons = await this.getTypeMenuButtons(record);

						const addBtn = btn({
							icon: "add",
							cls: "primary filled",
							style: {float: "left"},
							// temporary code for menu handling
							menu: menu({
									isDropdown: true
								},
								...menuButtons
							)
						});

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
											const type = eval(`new ${record.type}()`);

											const dlg = type.getDialog();

											dlg.form.value = {
												fieldSetId: record.fieldSetId,
												type: record.type
											}

											dlg.load(record.fieldId);
											dlg.show();
										}
									}
								}),
								btn({
									icon: "delete",
									text: t("Delete"),
									handler: () => {
										const idToDestroy = record.isFieldSet ? record.fieldSetId : record.fieldId;
										const typeToDestroy = record.isFieldSet ? "FieldSet" : "Field";

										const DS = new JmapDataSource(typeToDestroy);

										DS.confirmDestroy([idToDestroy]).then(() => {
											void this.load();
										});
									}
								})
							)
						});

						return record.isFieldSet ? comp({cls: "hbox gap"}, addBtn, moreMenu) : moreMenu;
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

						client.jmap("FieldSet/importFromJson", {
							entity: this.entityName,
							blobId: blob.id
						}).then((response) => {
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

						fieldSetDlg.form.on("save", () => {
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
		const tableData: StoreEntity[] = [];

		const fieldSetIdsQueryResponse = await fieldSetDS.query({filter: {entity: this.entityName}});
		const fieldSetsQueryResponse = await fieldSetDS.get(fieldSetIdsQueryResponse.ids);
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

			const fieldIdsQueryResponse = await fieldDS.query({filter: {fieldSetId: fieldset.id}})
			const fieldQueryResponse = await fieldDS.get(fieldIdsQueryResponse.ids);

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

	// TODO: replace with proper handling

	// Temporary function for building menu with all available customfield types
	private async getTypeMenuButtons(record: StoreEntity): Promise<Button[]> {
		const typeNames: string[] = [
			"Attachments",
			"Checkbox",
			"Data",
			"Date",
			"DateTime",
			"EncryptedText",
			"FunctionField",
			"Group",
			"Html",
			"MultiSelect",
			"Notes",
			"Number",
			"Select",
			"TemplateField",
			"Text",
			"TextArea",
			"TreeSelectField",
			"User",
			"YesNo"
		];

		const availableTypeButtons: Button[] = [];

		for (const typeName of typeNames) {
			try {
				const typeClass = await import(`./type/${typeName}.ts`);

				if (typeClass[typeName]) {
					const type = new typeClass[typeName]();

					availableTypeButtons.push(
						btn({
							icon: type.icon,
							text: t(type.label),
							handler: () => {
								const fieldDlg = type.getDialog();

								fieldDlg.form.value = {
									fieldSetId: record.fieldSetId,
									type: typeName
								}

								fieldDlg.show();

								fieldDlg.on("close", () => {
									void this.load();
								});
							}
						})
					)
				}
			} catch (e) {
			}
		}

		return availableTypeButtons
	}
}