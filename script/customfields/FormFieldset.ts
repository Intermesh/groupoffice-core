import {comp, fieldset, Fieldset, Field as FormField, Format, p, Component, span} from "@intermesh/goui";
import {customFields, Field, FieldSet as CustomFieldSet} from "./CustomFields.js"

export class FormFieldset extends Fieldset {
	constructor(public readonly fieldSet:CustomFieldSet) {
		super();

		this.title = fieldSet.name;

		if(fieldSet.description) {
			this.items.add(p(Format.textToHtml(fieldSet.description)));
		}

		const fields = customFields.getFieldSetFields(fieldSet),
			formFields = fields.map(f => this.createFormField(f));

		if(fieldSet.columns == 1) {
			this.items.add(...formFields);
		} else{
			this.addInColumns(formFields);
		}

	}

	private addInColumns(fields: Component[]) {
		const fieldsPerColumn = Math.floor(fields.length / this.fieldSet.columns),
			fieldsInFirstColumn = fieldsPerColumn + (fields.length % this.fieldSet.columns);

		this.cls = "hbox gap";

		for(let colIndex = 0; colIndex <this.fieldSet.columns; colIndex++) {
			this.items.add(comp({
				cls: "flow",
				flex: 1
			}, ...fields.splice(0, colIndex === 0 ? fieldsInFirstColumn : fieldsPerColumn)));
		}
	}

	private createFormField(f: Field) : Component {
		const cmp = customFields.getType(f).createFormField();

		if(f.suffix) {
			cmp.flex = 1;
			return comp({cls: "hbox"}, cmp, span({text: f.suffix, cls: "customfield-suffix"}));
		}

		return cmp
	}
}