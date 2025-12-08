import {datefield, DateField, Filter, numberfield, NumberField, select, SelectField, t} from "@intermesh/goui";
import {StrictFilterType} from "./StrictFilterType.js";

export class DateFilter extends StrictFilterType {
	private operatorSelect: SelectField;

	private numberField: NumberField;
	private rangeSelect: SelectField;
	private dateField: DateField;

	constructor(filter: Filter) {
		super(filter);

		this.items.add(
			this.operatorSelect = select({
				options: [
					{
						value: "before",
						name: t("is before, today plus")
					},
					{
						value: "after",
						name: t("is after, today plus")
					},
					{
						value: "beforedate",
						name: t("is before")
					},
					{
						value: "afterdate",
						name: t("is after")
					},
					{
						value: "equals",
						name: t("equals")
					},
					{
						value: "empty",
						name: t("Is empty")
					}
				],
				valueField: "value",
				width: 200,
				listeners: {
					setvalue: ({newValue, oldValue}) => {
						if (newValue !== oldValue) {
							this.hideAndClearAll();

							switch (newValue) {
								case "before":
								case "after":
									this.numberField.hidden = false;
									this.rangeSelect.hidden = false;
									break;
								case "beforedate":
								case "afterdate":
								case "equals":
									this.dateField.hidden = false;
									break;
								case "empty":
									break;
							}
						}
					}
				}
			}),
			this.numberField = numberfield({
				hidden: true,
				listeners: {
					setvalue: () => {
						this.onSetValue();
					}
				},
				decimals: 0
			}),
			this.rangeSelect = select({
				hidden: true,
				options: [
					{
						value: "days",
						name: t("days")
					},
					{
						value: "months",
						name: t("months")
					},
					{
						value: "years",
						name: t("years")
					}
				],
				valueField: "value",
				width: 200,
				value: "days",
				listeners: {
					setvalue: () => {
						this.onSetValue();
					}
				}
			}),
			this.dateField = datefield({
				hidden: true,
				listeners: {
					setvalue: () => {
						this.onSetValue();
					}
				}
			})
		);

		this.operatorSelect.value = "before";
	}

	private hideAndClearAll() {
		this.numberField.hidden = true;
		this.numberField.clear(false);

		this.rangeSelect.hidden = true;
		this.rangeSelect.clear(false);

		this.dateField.hidden = true;
		this.dateField.clear(false);

		this.valueField.clear();
	}

	private onSetValue() {
		const operator = this.operatorSelect.value;

		let value;

		switch (operator) {
			case "before":
				value = `< ${this.numberField.value} ${this.rangeSelect.value}`;
				break;
			case "after":
				value = `> ${this.numberField.value} ${this.rangeSelect.value}`;
				break;
			case "beforedate":
				value = `< ${this.dateField.value}`;
				break;
			case "afterdate":
				value = `> ${this.dateField.value}`;
				break;
			case "equals":
				value = this.dateField.value;
				break;
			case "empty":
			default:
				value = null;
				break;
		}

		this.valueField.value = value;
	}

	public load(value?: string) {
		this.valueField.value = value;

		if (!value || value === 'null') {
			this.operatorSelect.on("render", () => {
				this.operatorSelect.value = 'empty';
			});
			return;
		}

		const trimmedValue = value.trim();

		if (trimmedValue.startsWith('<') || trimmedValue.startsWith('>')) {
			const prefix = trimmedValue[0];
			const content = trimmedValue.slice(1).trim();

			const match = content.match(/^(\d+)\s+(days|months|years)$/);

			if (match) {
				const number = parseInt(match[1]);
				const range = match[2];
				const operator = prefix === '<' ? 'before' : 'after';

				this.operatorSelect.on("render", () => {
					this.operatorSelect.value = operator;
				});

				this.numberField.hidden = false;
				this.numberField.on("render", () => {
					this.numberField.value = number;
				});

				this.rangeSelect.hidden = false;
				this.rangeSelect.on("render", () => {
					this.rangeSelect.value = range;
				});
			} else {
				const operator = prefix === '<' ? 'beforedate' : 'afterdate';

				this.operatorSelect.on("render", () => {
					this.operatorSelect.value = operator;
				});

				this.dateField.hidden = false;
				this.dateField.on("render", () => {
					this.dateField.value = content;
				});
			}
		} else {
			this.operatorSelect.on("render", () => {
				this.operatorSelect.value = 'equals';
			});

			this.dateField.hidden = false;
			this.dateField.on("render", () => {
				this.dateField.value = trimmedValue;
			});
		}
	}
}