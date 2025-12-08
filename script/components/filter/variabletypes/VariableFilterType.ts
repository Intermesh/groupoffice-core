import {Component, ComponentEventMap, Filter, hiddenfield, HiddenField} from "@intermesh/goui";

export abstract class VariableFilterType extends Component {
	public valueField: HiddenField;

	protected constructor(filter: Filter) {
		super();

		this.items.add(
			this.valueField = hiddenfield()
		);
	}
}