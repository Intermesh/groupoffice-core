import {Filter, select, SelectField, t, TextField, textfield} from "@intermesh/goui";
import {StrictFilterType} from "./StrictFilterType.js";

export class StringFilter extends StrictFilterType {
	private operatorSelect: SelectField;
	private inputField: TextField;

	constructor(filter: Filter) {
		super(filter);

		this.items.add(
			this.operatorSelect = select({
				value: "contains",
				options: [
					{
						value: "contains",
						name: t("contains")
					},
					{
						value: "equals",
						name: t("equals")
					},
					{
						value: "startswith",
						name: t("starts with")
					},
					{
						value: "endswith",
						name: t("ends with")
					}
				],
				valueField: "value",
				width: 200
			}),
			this.inputField = textfield({
				flex: 1,
				listeners: {
					setvalue: ({newValue}) => {
						const operator = this.operatorSelect.value;

						let value = '';

						switch (operator) {
							case 'contains':
								value = '%' + newValue + '%';
								break;
							case 'equals':
								value = newValue;
								break;
							case 'startswith':
								value = newValue + '%';
								break;
							case 'endswith':
								value = '%' + newValue;
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

		const startsWithPercent = value.startsWith('%');
		const endsWithPercent = value.endsWith('%');

		let operator: string;
		let displayValue: string;

		if (startsWithPercent && endsWithPercent) {
			operator = 'contains';
			displayValue = value.slice(1, -1);
		} else if (startsWithPercent) {
			operator = 'endswith';
			displayValue = value.slice(1);
		} else if (endsWithPercent) {
			operator = 'startswith';
			displayValue = value.slice(0, -1);
		} else {
			operator = 'equals';
			displayValue = value;
		}

		this.operatorSelect.on("render", () => {
			this.operatorSelect.value = operator;
		});

		this.inputField.on("render", () => {
			this.inputField.value = displayValue;
		});
	}
}