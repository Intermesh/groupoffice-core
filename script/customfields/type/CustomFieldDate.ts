import {CustomFieldType} from "./CustomFieldType.js";
import {datecolumn, datefield, displaydatefield, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldDateDialog} from "./CustomFieldDateDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldDate extends CustomFieldType {
	constructor() {
		super(
			"Date",
			"event",
			t("Date")
		)
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldDateDialog();
	}

	createTableColumn(field:CustomField) {
		return datecolumn(this.getColumnConfig(field));
	}

	public createFormField(field:CustomField) {
		return datefield(this.getFormFieldConfig(field))
	}

	createDetailField(field:CustomField) {
		return displaydatefield({...this.getDetailFieldConfig(field), icon: undefined});
	}

	getFilter(field: CustomField) {
		const f =  super.getFilter(field)!;
		f.type = "date";
		f.multiple = false;
		return f;
	}
}

customFields.registerType(new CustomFieldDate());