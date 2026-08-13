import {Field, Filter} from "@intermesh/goui";
import {VariableFilterType} from "./VariableFilterType.js";
import {extjswrapper} from "../../ExtJSWrapper.js";

export class VariableComponentFilter extends VariableFilterType {

	constructor(filter: Filter) {
		super(filter);

		if (typeof filter.type === "string") {
			// backwards compat for extjs filters
			const cls = window.eval(filter.type) as any;
			const cmp = extjswrapper({comp: new cls});
			cmp.extJSComp.on("change", (c:any, newValue:any) => {
				this.valueField.value = newValue;
			})
			this.items.add(cmp);
		} else {
			const cmp = new filter.type as Field;
			cmp.on("change", ({newValue}) => {
				this.valueField.value = newValue;
			})
			this.items.add(cmp);
		}




	}
}