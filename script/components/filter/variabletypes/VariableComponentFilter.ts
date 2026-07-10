import {comp, Field, Filter} from "@intermesh/goui";
import {VariableFilterType} from "./VariableFilterType.js";

export class VariableComponentFilter extends VariableFilterType {

	constructor(filter: Filter) {
		super(filter);

		const comp = new filter.type as Field;

		this.items.add(comp);

		comp.on("change", ({newValue}) => {
			this.valueField.value = newValue;
		})
	}
}