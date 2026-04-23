import {Type} from "./Type.js";
import {datecolumn, datefield, displaydatefield, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {DateDialog} from "./DateDialog.js";
import {customFields, Field} from "../CustomFields.js";

export class Date extends Type {
	constructor() {
		super(
			"Date",
			"event",
			t("Date")
		)
	}

	getDialog(): FieldDialog {
		return new DateDialog();
	}

	createTableColumn(field:Field) {
		return datecolumn(this.getColumnConfig(field));
	}

	public createFormField(field:Field) {
		return datefield(this.getFormFieldConfig(field))
	}

	createDetailField(field:Field) {
		return displaydatefield({...this.getDetailFieldConfig(field), icon: undefined});
	}
}

customFields.registerType(new Date());