import {VariableFilterType} from "./VariableFilterType.js";
import {datefield, Filter, t} from "@intermesh/goui";

export class VariableDateFilter extends VariableFilterType {
	constructor(filter: Filter) {
		super(filter);

		this.items.add(
			datefield({
				label: t(filter.title),
				listeners: {
					change: ({newValue}) => {
						this.valueField.value = newValue;
					}
				}
			})
		)
	}
}