import {VariableFilterType} from "./VariableFilterType.js";
import {Filter, numberfield, NumberField, select, SelectField, t} from "@intermesh/goui";

export class VariableNumberFilter extends VariableFilterType {
	private operatorSelect: SelectField;
	private numberField: NumberField;

	constructor(filter: Filter) {
		super(filter);

		this.cls = "group";

		this.items.add(
			this.operatorSelect = select({
				options: [
					{
						value: "<",
						name: "<"
					},
					{
						value: "<=",
						name: "<="
					},
					{
						value: ">",
						name: ">"
					},
					{
						value: ">=",
						name: ">="
					},
					{
						value: "=",
						name: "="
					}
				],
				listeners: {
					change: ({newValue}) => {
						this.valueField.value = `${newValue} ${this.numberField.value}`;
					}
				},
				value: "<"
			}),
			this.numberField = numberfield({
				label: t(filter.title),
				listeners: {
					change: ({newValue}) => {
						this.valueField.value = `${this.operatorSelect.value} ${newValue}`;
					}
				}
			})
		)
	}
}