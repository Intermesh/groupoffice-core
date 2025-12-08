import {
	Filter,
	NumberField,
	numberfield,
	select,
	SelectField,
	t
} from "@intermesh/goui";
import {StrictFilterType} from "./StrictFilterType.js";

export class NumberFilter extends StrictFilterType {
	private operatorSelect: SelectField;
	private inputField: NumberField;

	constructor(filter: Filter) {
		super(filter);

		this.items.add(
			this.operatorSelect = select({
				value: "equals",
				options: [
					{
						value: "equals",
						name: t("equals")
					},
					{
						value: "greater",
						name: t("is greater than")
					},
					{
						value: "greaterorequal",
						name: t("is greater than or equal")
					},
					{
						value: "less",
						name: t("is less than")
					},
					{
						value: "lessorequal",
						name: t("is less than or equal")
					}
				],
				valueField: "value",
				width: 200
			}),
			this.inputField = numberfield({
				flex: 1,
				listeners: {
					setvalue: ({newValue}) => {
						const operator = this.operatorSelect.value;

						let value = '';

						switch (operator) {
							case 'equals':
								value = newValue;
								break;
							case 'greater':
								value = '> ' + newValue;
								break;
							case 'greaterorequal':
								value = '>= ' + newValue;
								break;
							case 'less':
								value = '< ' + newValue;
								break;
							case 'lessorequal':
								value = '<= ' + newValue;
								break;
						}

						this.valueField.value = value;
					}
				}
			})
		);
	}

	public load(value: string) {
		this.valueField.value = value;

		const trimmedValue = value.trim();

		let operator: string;
		let displayValue: string;

		if (trimmedValue.startsWith('>=')) {
			operator = 'greaterorequal';
			displayValue = trimmedValue.slice(2).trim();
		} else if (trimmedValue.startsWith('<=')) {
			operator = 'lessorequal';
			displayValue = trimmedValue.slice(2).trim();
		} else if (trimmedValue.startsWith('>')) {
			operator = 'greater';
			displayValue = trimmedValue.slice(1).trim();
		} else if (trimmedValue.startsWith('<')) {
			operator = 'less';
			displayValue = trimmedValue.slice(1).trim();
		} else {
			operator = 'equals';
			displayValue = trimmedValue;
		}

		this.operatorSelect.on("render", () => {
			this.operatorSelect.value = operator;
		});

		this.inputField.on("render", () => {
			this.inputField.value = parseFloat(displayValue);
		});
	}
}