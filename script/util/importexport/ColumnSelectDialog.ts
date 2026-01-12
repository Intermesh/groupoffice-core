import {
	btn,
	checkbox,
	checkboxselectcolumn,
	column,
	ComboBox,
	combobox,
	comp,
	fieldset,
	form,
	Form,
	hiddenfield,
	Store,
	t,
	table,
	Table,
	tbar,
	Window
} from "@intermesh/goui";
import {spreadsheetExportDS} from "./Export.js";
import {client} from "../../jmap/index.js";

export class ColumnSelectDialog extends Window {
	public form: Form;
	private columnGrid: Table;
	private presetCombo: ComboBox;
	private entity: string;

	constructor(entity: string, extension: string) {
		super();

		this.title = t("Select columns");
		this.height = 600;
		this.width = 400;
		this.resizable = true;
		this.modal = true;

		this.entity = entity;

		this.items.add(
			this.form = form({cls: "fit vbox", flex: 1},
				hiddenfield({name: "columns"}),
				comp({flex: 1, cls: "scroll"},
					fieldset({},
						comp({cls: "hbox gap"},
							this.presetCombo = combobox({
								flex: 1,
								label: t("Preset"),
								valueProperty: "id",
								displayProperty: "name",
								dataSource: spreadsheetExportDS,
								selectFirst: true,
								storeConfig: {
									filters: {
										defaults: {
											userId: client.user.id,
											entity: entity
										}
									}
								},
								listeners: {
									setvalue: async ({newValue}) => {
										const preset = await spreadsheetExportDS.single(newValue);

										this.columnGrid.rowSelection!.clear();

										preset.columns.forEach((c: string) => {
											const record = this.columnGrid.store.find((r: any) => r.name === c)!;

											this.columnGrid.rowSelection!.add(record);
										});
									}
								}
							}),
							btn({
								icon: "add",
								title: t("Create new preset"),
								handler: async () => {
									this.save(true);
								}
							})
						),
						tbar({},
							btn({
								text: t("Delete"),
								handler: async () => {
									if (this.presetCombo.value) {
										const id: string = this.presetCombo.value as string;

										const result = await spreadsheetExportDS.confirmDestroy([id]);

										if (result != false) {
											this.presetCombo.value = null;
										}
									}
								}
							}),
							'->',
							btn({
								text: t("Save"),
								handler: () => {
									this.save(false);
								}
							})
						),
						checkbox({
							label: t("Select all"),
							listeners: {
								change: ({newValue}) => {
									const rs = this.columnGrid.rowSelection!;
									newValue ? rs.selectAll() : rs.clear();
								}
							}
						}),
					),

					this.columnGrid = table({
						rowSelectionConfig: {
							multiSelect: true,
							listeners: {
								selectionchange: ({selected}) => {
									this.form.findField("columns")!.value = selected.map((row) => row.record.name);
								}
							}
						},
						headers: false,
						fitParent: true,
						store: new Store(),
						columns: [
							checkboxselectcolumn(),
							column({
								id: "label"
							})
						]
					}),
				),
				tbar({
						cls: "border-top",
					},
					'->',
					btn({
						text: t("Export"),
						type: 'submit',
						handler: () => {
							this.form.submit();
						}
					})
				)
			)
		);

		this.load(entity, extension);
	}

	private load(entity: string, extension: string) {
		client.jmap(entity + "/exportColumns", {extension: extension}).then((result) => {
			const records: any[] = [];

			for (const name in result) {
				if (!result[name].label) {
					result[name].label = name;
				}
				records.push(result[name]);
			}

			this.columnGrid.store.loadData(records);
		});
	}

	private async save(isNew: boolean) {
		let defaultName = "";

		if (!isNew) {
			const preset = await spreadsheetExportDS.single(this.presetCombo.value as string);

			defaultName = preset.name;
		}

		const name = await Window.prompt(t("Please enter a name"), t("name"), defaultName);

		if (!name) {
			return
		}

		const selected = this.columnGrid.rowSelection!.getSelected().map((row) => row.record.name);

		if (selected.length > 0) {
			if (isNew) {
				spreadsheetExportDS.create({
					name: name,
					entity: this.entity,
					columns: selected,
					userId: client.user.id
				}).then((result) => {
					this.presetCombo.value = result.id;
				});
			} else if (this.presetCombo.value) {
				spreadsheetExportDS.update(this.presetCombo.value as string, {
					name: name,
					columns: selected
				}).then((result) => {
					this.presetCombo.value = null; // force name reload
					this.presetCombo.value = result.id;
				});
			}
		}
	}
}