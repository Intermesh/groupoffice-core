import {
	arrayfield,
	btn,
	ComboBox,
	combobox,
	comp,
	Component,
	containerfield,
	fieldset,
	form,
	Form,
	Format,
	h3,
	menu,
	select,
	SelectField,
	Store,
	store,
	t,
	tbar,
	textfield,
	Window
} from "@intermesh/goui";
import {importMapping, importMappingDS} from "./Import.js";
import {client} from "../../jmap/index.js";

export class CsvMappingDialog extends Window {
	private form: Form;
	private fieldMappingContainer: Component;
	private importMappingCombo: ComboBox;
	private lookupSelect: SelectField;

	private entity: string;
	private readonly blobId: string;
	private readonly values: Record<string, any>;
	private fields: Record<string, any>;

	private csvHeadersStore!: Store;
	private mappingId: string | undefined;
	private importMapping!: importMapping;

	constructor(entity: string, fileName: string, blobId: string, values: Record<string, any>, fields: Record<string, any>, aliases: Record<string, any>, lookupFields: Record<string, any>) {
		super();

		this.entity = entity;
		this.blobId = blobId;
		this.values = values;
		this.fields = fields;

		this.title = t("Import Comma Separated values");

		this.width = 800;
		this.height = 900;

		this.modal = true;

		this.items.add(
			this.form = form({cls: "fit vbox", flex: 1},
				comp({flex: 1, cls: "scroll"},
					fieldset({},
						comp({
							tagName: "p",
							html: t("Please match the CSV columns with the correct Group-Office columns and press 'Import' to continue.") +
								`<br>` + t('The column profile will be saved with the name provided field below.')
						}),
						this.importMappingCombo = combobox({
							name: "mappingId",
							label: t("Column profile"),
							dataSource: importMappingDS,
							displayProperty: "name",
							valueProperty: "id",
							listeners: {
								setvalue: async ({newValue, oldValue}) => {
									if (newValue === oldValue) {
										return
									}

									const record = await importMappingDS.single(newValue);

									this.importMapping = record;

									this.form.value = {
										mappingId: newValue,
										columnMapping: record.columnMapping,
										dateFormat: record.dateFormat,
										timeFormat: record.timeFormat,
										decimalSeparator: record.decimalSeparator,
										thousandsSeparator: record.thousandsSeparator,
										updateBy: record.updateBy
									};
								}
							},
							buttons: [
								btn({
									icon: "edit",
									menu: menu({},
										btn({
											text: t("Rename"),
											handler: async () => {
												const name = await Window.prompt("Name", this.importMapping.name);

												if (name) {
													this.importMapping.name = name;
												}
											}
										}),
										btn({
											text: t("Copy as"),
											handler: async () => {
												if (this.importMapping.id !== "new") {
													const name = await Window.prompt("Name", this.importMapping.name);

													if (name) {
														importMappingDS.create({
															name: name,
															columnMapping: this.form.value.mapping,
															timeFormat: this.form.value.timeFormat,
															dateFormat: this.form.value.dateFormat,
															decimalSeparator: this.form.value.decimalSeparator,
															thousandsSeparator: this.form.value.thousandsSeparator,
															updateBy: this.form.value.updateBy
														}).then((response) => {
															this.importMappingCombo.value = response.id;
														})
													}
												}
											}
										}),
										btn({
											text: t("Delete"),
											handler: async () => {
												if (this.importMapping.id !== "new") {
													await importMappingDS.confirmDestroy([this.importMapping.id])
												}
											}
										})
									)
								})
							]
						})
					),
					fieldset({
							cls: "border-top vbox gap",
							hidden: (fileName.toLowerCase().slice(-3) != 'csv'),
							title: t("Formatting")
						},
						textfield({
							name: "dateFormat",
							value: client.user.dateFormat,
							label: t("Date format")
						}),
						textfield({
							name: "timeFormat",
							value: client.user.timeFormat,
							label: t("Time format")
						}),
						textfield({
							name: "decimalSeparator",
							value: Format.decimalSeparator,
							label: t("Decimal separator")
						}),
						textfield({
							name: "thousandsSeparator",
							value: Format.thousandsSeparator,
							label: t("Thousand Separator")
						})
					),
					fieldset({
							title: t("Field mapping")
						},
						this.lookupSelect = this.buildLookupCombo(lookupFields)
					),
					fieldset({},
						this.fieldMappingContainer = comp({cls: "vbox gap"})
					),
				),
				tbar({
						cls: "border-top",
					},
					'->',
					btn({
						text: t("Import"),
						type: 'submit',
						handler: () => {
							this.import();
						}
					})
				)
			)
		);

		this.on("render", async () => {
			this.mask();

			client.jmap(entity + "/importCSVMapping", {blobId: blobId}).then((response) => {
				this.csvHeadersStore = store({
					data: [
						{
							index: -2,
							name: ""
						},
						{
							index: -1,
							name: t("Fixed value")
						},
						...response.csvHeaders.map((str: string, i: number) => ({
							index: i,
							name: str
						}))
					]
				});

				const fields = this.buildFieldsForMapping(response.goHeaders);

				this.fieldMappingContainer.items.add(containerfield({name: "columnMapping"}, ...fields));

				this.form.value = {
					mappingId: response.id,
					columnMapping: response.columnMapping,
					updateBy: response.updateBy,
					dateFormat: response.dateFormat ?? client.user.dateFormat,
					timeFormat: response.timeFormat ?? client.user.timeFormat,
					decimalSeparator: response.decimalSeparator ?? Format.decimalSeparator,
					thousandsSeparator: response.thousandsSeparator ?? Format.thousandsSeparator
				};

				if (!response.id) {
					this.importMapping = {
						id: "new",
						name: fileName,
						columnMapping: {},
						updateBy: "",
						dateFormat: client.user.dateFormat,
						timeFormat: client.user.timeFormat,
						decimalSeparator: Format.decimalSeparator,
						thousandsSeparator: Format.thousandsSeparator
					}

					this.lookupSelect.store!.add(this.importMapping);
					this.lookupSelect.value = "new";
				} else {
					this.importMapping = response;
				}
			}).catch((e) => {
				Window.error(e);
			}).finally(() => {
				this.unmask();
			});
		});
	}

	private buildLookupCombo(lookupFields: Record<string, any>): SelectField {
		const records: { field: string | null, label: string }[] = [];

		records.push({field: null, label: t("Don't update")});

		for (const field in lookupFields) {
			records.push({field: field, label: lookupFields[field]})
		}

		return select({
			store: store({
				data: records
			}),
			name: "updateBy",
			valueField: "field",
			textRenderer: ((r) => {
				return r.label
			}),
			label: t("Update existing items by"),
			value: null
		});
	}

	private buildFieldsForMapping(goHeaders: Record<string, any>): Component[] {
		const mappingFields: Component[] = [];

		Object.keys(goHeaders).forEach((key) => {
			const header = goHeaders[key];

			if (header.properties) {
				const fields: Component[] = [];

				if (header.many) {
					const arrayField = arrayfield({
						buildField: () => {
							const field = containerfield({cls: "hbox gap"},
								comp({cls: "vbox gap"},
									...this.buildFieldsForMapping(header.properties)
								),
								btn({
									itemId: "deleteBtn",
									icon: "delete",
									handler: () => {
										field.remove();
									}
								})
							)

							return field;
						}
					});

					const container = comp({cls: "border-top"},
						h3({text: header.label ?? header.name}),
						comp({cls: "vbox gap"},
							arrayField,
							btn({
								text: t("Add"),
								handler: () => {
									arrayField.addValue({});
								}
							})
						)
					);

					mappingFields.push(container);
				} else {
					fields.push(...this.buildFieldsForMapping(header.properties));

					mappingFields.push(...fields);
				}
			} else {
				mappingFields.push(this.getFieldsForHeader(header));
			}
		});

		return mappingFields;
	}

	private getFieldsForHeader(header: Record<string, any>): Component {
		const fixedValueField = textfield({
			name: "fixed",
			label: t("Fixed value"),
			hidden: true
		});

		const selectField = select({
			name: "csvIndex",
			width: 200,
			label: header.label ?? header.name,
			store: this.csvHeadersStore,
			value: -2,
			valueField: "index",
			textRenderer: ((r) => {
				return r.name
			}),
			listeners: {
				setvalue: ({newValue}) => {
					fixedValueField.hidden = !(newValue === -1);
				}
			}
		});

		return containerfield({name: header.name, cls: "hbox gap"}, selectField, fixedValueField);
	}

	private import() {
		const value = this.form.value;

		this.mask();

		client.jmap(this.entity + "/import", {
			blobId: this.blobId,
			values: this.values,
			mappingId: this.mappingId,
			mapping: value.mapping,
			saveName: this.importMapping.name,
			updateBy: value.updateBy,
			decimalSeparator: value.decimalSeparator,
			thousandsSeparator: value.thousandsSeparator,
			dateFormat: value.dateFormat,
			timeFormat: value.timeFormat
		}).then((response) => {
			Window.alert(t("Importing is in progress in the background. You will be kept informed about progress via notifications."), t("Success"));
		}).catch((e) => {
			Window.error(e);
		}).finally(() => {
			this.unmask();
			this.close();
		});
	}
}