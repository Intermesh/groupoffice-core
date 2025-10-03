import {btn, comp, Component, containerfield, h3, tbar} from "@intermesh/goui";
import {customFields, FieldSet as CustomFieldSet} from "./CustomFields.js";

export class DetailFieldset extends Component {
	private container: Component;
	constructor(public readonly fieldSet:CustomFieldSet) {
		super();

		this.cls = "card";

		this.items.add(
			tbar({},
				h3(fieldSet.name),
				"->",
				btn({
					icon: "expand_less",
					handler: (btn) => {
						this.container.hidden = !this.container.hidden;
						btn.icon = this.container.hidden ? "expand_more" : "expand_less";
					}
				})
			),

			this.container = containerfield({cls: "hbox gap", keepUnknownValues: false, name: "customFields"})
		);

		const fields = customFields.getFieldSetFields(fieldSet),
			formFields = fields.map(f =>  customFields.getType(f).createDetailField()).filter(f => f !== undefined);

		if(fieldSet.columns == 1) {
			this.container.items.add(...formFields);
		} else{
			this.addInColumns(formFields);
		}
	}

	private addInColumns(fields: Component[]) {
		const fieldsPerColumn = Math.floor(fields.length / this.fieldSet.columns),
			fieldsInFirstColumn = fieldsPerColumn + (fields.length % this.fieldSet.columns);

		for(let colIndex = 0; colIndex <this.fieldSet.columns; colIndex++) {
			this.container.items.add(comp({
				cls: "flow",
				flex: 1
			}, ...fields.splice(0, colIndex === 0 ? fieldsInFirstColumn : fieldsPerColumn)));
		}
	}

}