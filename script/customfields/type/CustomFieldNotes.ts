import {CustomFieldType} from "./CustomFieldType.js";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {p, t} from "@intermesh/goui";
import {CustomFieldNotesDialog} from "./CustomFieldNotesDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldNotes extends CustomFieldType {
	constructor() {
		super("Notes", "note", t("Notes"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldNotesDialog();
	}

	createFormField(field:CustomField) {
		return p({html: field.options.formNotes});
	}

	createDetailField(field:CustomField) {
		return p({html: field.options.detailNotes});
	}

	createTableColumn() {
		return  undefined;
	}
}

customFields.registerType(new CustomFieldNotes);