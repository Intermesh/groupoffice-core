import {Fieldset, Filter, hiddenfield, HiddenField} from "@intermesh/goui";

export abstract class StrictFilterType extends Fieldset {
	private filter: Filter;
	protected valueField: HiddenField;

	protected constructor(filter: Filter) {
		super();

		this.filter = filter;

		this.cls = "hbox";
		this.style = {
			padding: "0",
			maxWidth: "100%",
			overflowX: "scroll"
		};

		this.items.add(
			this.valueField = hiddenfield({
				name: filter.name
			})
		);
	}

	abstract load(value:any): void;
}