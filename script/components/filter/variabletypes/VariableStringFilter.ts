import {Filter, t, textfield, TextField} from "@intermesh/goui";
import {VariableFilterType} from "./VariableFilterType.js";

export class VariableStringFilter extends VariableFilterType {
	public inputField: TextField;

	constructor(filter: Filter) {
		super(filter);

		this.items.add(
			this.inputField = textfield({
				label: t(filter.title),
				listeners: {
					change: ({newValue}) => {
						this.valueField.value = `%${newValue}%`;
					}
				}
			})
		);
	}
}