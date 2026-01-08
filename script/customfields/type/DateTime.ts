import {Type} from "./Type.js";
import {datetimecolumn, datetimefield, displaydatefield, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {DateTimeDialog} from "./DateTimeDialog.js";
import {customFields, Field} from "../CustomFields.js";

export class DateTime extends Type {
	constructor() {
		super();

		this.name = "DateTime";
		this.label = t("Date and time");
		this.icon = "schedule";
	}

	getDialog(): FieldDialog {
		return new DateTimeDialog();
	}

	createTableColumField(field:Field) {
		return datetimecolumn(this.getColumnConfig(field));
	}

	public createFormField(field:Field) {
		return datetimefield(this.getFormFieldConfig(field))
	}

	createDetailField(field:Field) {
		return displaydatefield({withTime: true,icon: undefined, ...this.getDetailFieldConfig(field)});
	}
}
customFields.registerType(DateTime);