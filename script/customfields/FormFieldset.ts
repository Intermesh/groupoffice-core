import {fieldset, Fieldset, Form, Format, p} from "@intermesh/goui";
import {customFields, FieldSet as CustomFieldSet} from "./CustomFields.js"

export class FormFieldset extends Fieldset {
	constructor(public readonly fieldSet:CustomFieldSet) {
		super();

		this.title = fieldSet.name;

		if(fieldSet.description) {
			this.items.add(p(Format.textToHtml(fieldSet.description)));
		}

		const fields = customFields.getFieldSetFields(fieldSet);
		this.items.add(...fields.map(f => customFields.getType(f).createFormField()));

	}
}