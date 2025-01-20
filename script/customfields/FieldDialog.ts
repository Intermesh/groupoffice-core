import {FormWindow} from "../components/index.js";
import {
	checkbox,
	CheckboxField,
	comp, Fieldset,
	fieldset, HiddenField, hiddenfield,
	t,
	textarea,
	TextAreaField,
	TextField,
	textfield
} from "@intermesh/goui";

export class FieldDialog extends FormWindow {
	protected generalFieldset: Fieldset;
	protected validationFieldset: Fieldset;
	protected typeField: TextField;
	fieldSetField: HiddenField;
	private databaseNameField: TextField;
	private readonly relatedFieldCondition: TextAreaField;
	private readonly conRequired: CheckboxField;
	private readonly conHidden: CheckboxField;
	private readonly required: CheckboxField;

	constructor() {
		super("Field");

		this.title = t("Field");

		this.maximizable = true;
		this.resizable = true;
		this.height = 700;
		this.width = 1000;

		this.generalTab.items.add(
			comp({
					cls: "hbox"
				},
				this.generalFieldset = fieldset({
						flex: 1
					},
					comp({
						tagName: "h4",
						text: t("General")
					}),
					this.fieldSetField = hiddenfield({
						name: "fieldSetId"
					}),
					this.typeField = textfield({
						name: "type",
						label: t("Type"),
						disabled: true
					}),
					textfield({
						name: "name",
						label: t("Name"),
						required: true,
						listeners: {
							change: (field, newValue, oldValue) => {
								if (this.databaseNameField.value != "")
									return;

								const dbName = this.parseDbName(newValue);

								if (dbName.length === 0)
									return;

								this.databaseNameField.value = dbName;
							}
						}
					}),
					this.databaseNameField = textfield({
						name: "databaseName",
						label: t("Database name"),
						required: true,
						hint: t("This name is used in the database and can only contain alphanumeric characters and underscores. It's only visible to exports and the API."),
						listeners: {
							change: (field, newValue, oldValue) => {
								const dbName = this.parseDbName(newValue);

								if (dbName.length === 0)
									return;

								field.value = dbName;
							}
						}
					}),
					textfield({
						name: "hint",
						label: t("Hint text")
					}),
					textfield({
						name: "prefix",
						label: t("Prefix")
					}),
					textfield({
						name: "suffix",
						label: t("Suffix")
					}),
					checkbox({
						name: "hiddenInGrid",
						label: t("Hidden in grid"),
						value: true,
						hint: t("Field will be hidden by default in grids. Users can enable it through the grid column menu.")
					})
				),
				this.validationFieldset = fieldset({
						flex: 1
					},
					comp({
						tagName: "h4",
						text: t("Validation")
					}),
					checkbox({
						name: "unique",
						label: t("Unique values")
					}),
					this.required = checkbox({
						name: "required",
						label: t("Required field"),
						listeners: {
							change: (field, newValue, oldValue) => {
								this.relatedFieldCondition["disabled"] = newValue;
								this.conHidden["disabled"] = newValue;
								this.conRequired["disabled"] = newValue;

								if (newValue) {
									this.conRequired.value = false;
									this.conHidden.value = false;
								}
							}
						}
					}),
					this.relatedFieldCondition = textarea({
						name: "relatedFieldCondition",
						label: t("Required condition"),
						hint: t("eg. 'nameOfStandardOrCustomField = test' or 'checkbox = 1'"),
						validateOnBlur: true,
						listeners: {
							validate: (field) => {
								if (field.value === "")
									return

								let rawValue: string = "";

								const reConditions = /(={1,2}|<|>|\!=|>=|<=)/, reAdjuncts = /\ (AND|OR)\ /;
								const reEmptyCondition = /^\w+\ is empty$/;
								const reNotEmptyCondition = /^\w+\ is not empty$/;
								const arSubConditions = String(field.value).split(reAdjuncts);

								for (let i = 0, l = arSubConditions.length; i < l; i++) {
									const strCond = arSubConditions[i];

									if (strCond === "AND" || strCond === "OR") {
										if (rawValue) rawValue += (" " + strCond + " ");
										continue;
									}

									const arVal = String(strCond).split(reConditions);

									if (arVal.length === 3) {
										rawValue += (arVal[0].trim() + " " + arVal[1] + " " + arVal[2].trim());
									} else if (strCond.match(reEmptyCondition) || strCond.match(reNotEmptyCondition)) {
										rawValue += strCond.replace(/\s{2,}/, ' ').trim()
									} else {
										field.setInvalid(t('The value was not formatted correctly'));
										return;
									}
								}

								field.value = rawValue;
							}
						}
					}),
					this.conRequired = checkbox({
						name: "conditionallyRequired",
						label: t("Conditionally required field"),
						listeners: {
							change: (field, newValue, oldValue) => {
								if (this.conHidden.value || newValue) {
									this.conHidden["disabled"] = false;
								}

								if (newValue) {
									this.conHidden.value = !newValue;
									this.conHidden["disabled"] = newValue;

									this.required.value = !newValue;
									this.required["disabled"] = newValue;
								} else {
									this.conHidden["disabled"] = newValue;
									this.required["disabled"] = newValue;
								}
							}
						}
					}),
					this.conHidden = checkbox({
						name: "conditionallyHidden",
						label: t("Conditionally hidden field"),
						listeners: {
							change: (field, newValue, oldValue) => {
								if (this.conRequired.value || newValue) {
									this.conRequired["disabled"] = false;
								}

								if (newValue) {
									this.conRequired.value = !newValue;
									this.conRequired["disabled"] = newValue;

									this.required.value = !newValue;
									this.required["disabled"] = newValue;
								} else {
									this.conRequired["disabled"] = newValue;
									this.required["disabled"] = newValue;
								}
							}
						}
					})
				)
			)
		)
	}

	private isReserved(value: string) {
		const reservedValues = ['select', 'char', 'table', 'action', 'add', 'alter', 'bigint', 'bit', 'cascade', 'change', 'character',
			'charset', 'check', 'clob', 'column', 'columns', 'comment', 'constraint', 'constraints', 'create', 'current_user', 'datetime',
			'dec', 'decimal', 'deferred', 'default', 'deferrable', 'double', 'drop', 'engine', 'exists', 'foreign', 'full', 'idb_blob',
			'idb_char', 'idb_delete', 'idb_float', 'idb_int', 'if', 'immediate', 'index', 'initially', 'integer', 'key', 'match',
			'max_rows', 'min_rows', 'modify', 'no', 'not', 'null_tok', 'number', 'numeric', 'on', 'partial', 'precision',
			'primary', 'real', 'references', 'rename', 'restrict', 'session_user', 'set', 'smallint', 'system_user', 'table',
			'time', 'tinyint', 'to', 'truncate', 'unique', 'unsigned', 'update', 'user', 'varbinary', 'varchar', 'varying',
			'with', 'zone'];

		return (reservedValues.indexOf(String(value).toLowerCase()) > -1);
	}

	private parseDbName(dbName: string) {
		dbName = dbName.replace(/\s+/g, '_');
		dbName = dbName.replace(/[^A-Za-z0-9_\-]+/g, "");
		dbName = dbName.replace(/^[0-9]+/, '');

		if (dbName.length === 0)
			return dbName;

		if (this.isReserved(dbName)) {
			dbName = "go_" + dbName
		}

		return dbName
	}
}