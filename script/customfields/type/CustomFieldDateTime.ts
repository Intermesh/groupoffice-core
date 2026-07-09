import {CustomFieldType} from "./CustomFieldType.js";
import {datetimecolumn, datetimefield, displaydatefield, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldDateTimeDialog} from "./CustomFieldDateTimeDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldDateTime extends CustomFieldType {
	constructor() {
		super(
			"DateTime",
			"schedule",
			t("Date and time")
		);
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldDateTimeDialog();
	}

	createTableColumField(field:CustomField) {
		return datetimecolumn(this.getColumnConfig(field));
	}

	public createFormField(field:CustomField) {
		return datetimefield(this.getFormFieldConfig(field))
	}

	createDetailField(field:CustomField) {
		return displaydatefield({withTime: true,icon: undefined, ...this.getDetailFieldConfig(field)});
	}

	getFilter(field: CustomField) {
		const f =  super.getFilter(field)!;
		f.type = "date";
		f.multiple = false;
		return f;
	}
}
customFields.registerType(new CustomFieldDateTime);