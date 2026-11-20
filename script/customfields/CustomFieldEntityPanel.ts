import {
	ArrayUtil,
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
	tbar,
	Window
} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {FieldSetDialog} from "./FieldSetDialog.js";
import {ExportDialog} from "./ExportDialog.js";
import {customFields, fieldSetDS} from "./CustomFields.js";
import {fieldDS} from "./index.js";

interface StoreEntity {
	name: string,
	databaseName?: string,
	type?: string,
	fieldId?: EntityID,
	fieldSetId?: EntityID,
	isFieldSet: boolean,
	sortOrder: number,
	// aclId?: EntityID,
	permissionLevel: number
}

export class CustomFieldEntityPanel extends Component {
	private readonly store: Store<StoreEntity>
	private readonly table: Table
	private readonly entityName: string

	constructor(entityName: string) {
		super();

		this.entityName = entityName;

		this.store = store<StoreEntity>();

		this.table = table({
			store: this.store,
			cls: "bg-lowest",
			// sort field sets and fields with drag and drop. Fields can be moved to another field set.
			draggableRows: true,
			dropBetween: true,
			listeners: {
				dropallowed: ({source, fromIndex, toIndex}) => {
					return source === this.table && this.isDropAllowed(fromIndex, toIndex);
				},
				drop: ({source, fromIndex, toIndex}) => {
					if (source === this.table && this.isDropAllowed(fromIndex, toIndex)) {
						void this.onDrop(fromIndex, toIndex);
					}
				}
			},
			columns: [
				column({
					id: "name",
					header: t("Name"),
					renderer: (value, record) => {
						return record.isFieldSet ? comp({tagName: "h5", text: value}) : value;
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
									// isDropdown: true
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
										this.edit(record);
									}
								}),
								btn({
									icon: "delete",
									text: t("Delete"),
									handler: () => {
										const idToDestroy = record.isFieldSet ? record.fieldSetId : record.fieldId;
										const DS = record.isFieldSet ? fieldSetDS : fieldDS;

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

		this.table.on("rowdblclick", (ev) => {
			this.edit(this.store.get(ev.storeIndex)!)
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

	private edit(record:StoreEntity) {
		if (record.isFieldSet) {
			const dlg = new FieldSetDialog();

			void dlg.load(record.fieldSetId!);
			dlg.show();
		} else {
			const type = customFields.getType(record.type!)

			const dlg = type.getDialog();

			dlg.form.value = {
				fieldSetId: record.fieldSetId,
				type: record.type
			}

			dlg.load(record.fieldId!);
			dlg.show();
		}
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
				// aclId: fieldset.aclId,
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
					fieldSetId: fieldset.id,
					isFieldSet: false,
					sortOrder: field.sortOrder,
					// aclId: undefined,
					permissionLevel: fieldset.permissionLevel
				}

				tableData.push(fieldStoreEntity)
			}
		}

		this.store.clear();
		this.store.loadData(tableData);
	}


	/**
	 * Field sets may only be dropped before another field set or at the end. Fields must be dropped below a field set.
	 *
	 * @param fromIndex The store index of the dragged row
	 * @param toIndex The store index the row is inserted before
	 */
	private isDropAllowed(fromIndex: number, toIndex: number): boolean {
		const dragged = this.store.get(fromIndex);
		if (!dragged) {
			return false;
		}

		if (dragged.isFieldSet) {
			const over = this.store.get(toIndex);
			return !over || over.isFieldSet;
		}

		// The first row is always a field set, so a field must be dropped after it
		return toIndex > 0;
	}

	/**
	 * Save the new order after a drop
	 *
	 * @param fromIndex The store index of the dragged row
	 * @param toIndex The store index the row is inserted before
	 */
	private async onDrop(fromIndex: number, toIndex: number) {
		const dragged = this.store.get(fromIndex)!;

		this.mask();
		try {
			if (dragged.isFieldSet) {
				// Only the field set order changes. Reload afterward so the fields move along with their field set.
				const fieldSetIds = this.store.data.filter(r => r.isFieldSet && r !== dragged).map(r => r.fieldSetId!);
				const insertAt = this.store.data.slice(0, toIndex).filter(r => r.isFieldSet && r !== dragged).length;
				fieldSetIds.splice(insertAt, 0, dragged.fieldSetId!);

				await Promise.all(fieldSetIds.map((id, sortOrder) => fieldSetDS.update(id, {sortOrder})));
			} else {
				this.store.move(fromIndex, toIndex);

				// Give every field the field set above it and a new sort order. Only save the changed fields.
				const updates: Promise<any>[] = [];
				let fieldSetId: EntityID | undefined, sortOrder = 0;
				for (const r of this.store.data) {
					if (r.isFieldSet) {
						fieldSetId = r.fieldSetId;
						continue;
					}

					const changes: Partial<StoreEntity> = {};
					if (r.sortOrder !== sortOrder) {
						changes.sortOrder = sortOrder;
					}
					if (r.fieldSetId !== fieldSetId) {
						changes.fieldSetId = fieldSetId;
					}

					if (Object.keys(changes).length) {
						Object.assign(r, changes);
						updates.push(fieldDS.update(r.fieldId!, changes));
					}
					sortOrder++;
				}

				await Promise.all(updates);
			}
		} catch (e) {
			void Window.error(e);
		} finally {
			this.unmask();
		}

		// load the saved order and permissions from the server
		await this.load();
	}

	private async getTypeMenuButtons(record: StoreEntity): Promise<Button[]> {

		const availableTypeButtons: Button[] = [];

		for (const typeName of customFields.getTypes().sort()) {

			const type = customFields.getType(typeName);

			availableTypeButtons.push(
				btn({
					icon: type.icon,
					text: type.label,
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

		return ArrayUtil.multiSort(availableTypeButtons, [{property: "text"}]);
	}
}