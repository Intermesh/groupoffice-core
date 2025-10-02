import {comp, fieldset, Fieldset, Field as FormField, Format, p} from "@intermesh/goui";
import {customFields, Field, FieldSet as CustomFieldSet} from "./CustomFields.js"

export class FormFieldset extends Fieldset {
	constructor(public readonly fieldSet:CustomFieldSet) {
		super();

		this.title = fieldSet.name;

		if(fieldSet.description) {
			this.items.add(p(Format.textToHtml(fieldSet.description)));
		}

		const fields = customFields.getFieldSetFields(fieldSet),
			formFields = fields.map(f => customFields.getType(f).createFormField());

		if(fieldSet.columns == 1) {
			this.items.add(...formFields);
		} else{
			this.addInColumns(formFields);
		}

	}

	private addInColumns(fields: FormField[]) {
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
}