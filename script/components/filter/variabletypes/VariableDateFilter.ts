import {VariableFilterType} from "./VariableFilterType.js";
import {daterangefield, Filter, t} from "@intermesh/goui";

export class VariableDateFilter extends VariableFilterType {
	constructor(filter: Filter) {
		super(filter);

		this.items.add(
			daterangefield({
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