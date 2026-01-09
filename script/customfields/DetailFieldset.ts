import {btn, comp, Component, ContainerField, containerfield, Field, FunctionUtil, h3, tbar} from "@intermesh/goui";
import {customFields, FieldSet as CustomFieldSet} from "./CustomFields.js";

export class DetailFieldset extends Component {
	private container: ContainerField;
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
			formFields = fields.map(f =>  {
				return customFields.getType(f.type).createDetailField(f)
			}).filter(f => f !== undefined);

		// Buffer this function so it's not called many times for each field. We want to react on each field because some load async and might be hidden later.
		const bufferedToggleVisibility = FunctionUtil.buffer(0, () => {
			this.hidden = !this.hasVisibleFields();
		});

		formFields.forEach(f => {
			f.on("hide", bufferedToggleVisibility);
			f.on("show",bufferedToggleVisibility);
		})

		if(fieldSet.columns == 1) {
			this.container.items.add(...formFields);
		} else{
			this.addInColumns(formFields);
		}
	}


	private hasVisibleFields() {

		const formFields = this.container.findChildrenByType(Field);

		for(let i = 0; i < formFields.length; i++) {
			if(!formFields[i].hidden) {
				return true;
			}
		}
		return false;
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