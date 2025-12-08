import {VariableFilterType} from "./VariableFilterType.js";
import {Filter, select, t} from "@intermesh/goui";

export class VariableSelectFilter extends VariableFilterType {
	constructor(filter: Filter) {
		super(filter);

		this.items.add(
			select({
				label: t(filter.title),
				options: filter.options,
				textRenderer: (r: any) => r.title,
				listeners: {
					setvalue: ({newValue}) => {
						this.valueField.value = newValue
					}
				}
			})
		);
	}
}