import {Filter, select, SelectField} from "@intermesh/goui";
import {StrictFilterType} from "./StrictFilterType.js";

export class SelectFilter extends StrictFilterType {
	private selectField: SelectField;

	constructor(filter: Filter) {
		super(filter);

		this.items.add(
			this.selectField = select({
				options: filter.options,
				valueField: "value",
				textRenderer: (r: any) => r.title,
				listeners: {
					setvalue: ({newValue}) => {
						this.valueField.value = newValue
					}
				}
			})
		);
	}

	public load(value: string) {
		this.selectField.on("render", () => {
			this.selectField.value = value;
		});

		this.valueField.value = value;
	}
}