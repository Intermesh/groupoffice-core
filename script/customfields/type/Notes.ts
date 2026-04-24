import {Type} from "./Type.js";
import {FieldDialog} from "../FieldDialog.js";
import {p, t} from "@intermesh/goui";
import {NotesDialog} from "./NotesDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {TemplateField} from "./TemplateField.js";

export class Notes extends Type {
	constructor() {
		super("Notes", "note", t("Notes"));
	}

	getDialog(): FieldDialog {
		return new NotesDialog();
	}

	createFormField(field:Field) {
		return p({html: field.options.formNotes});
	}

	createDetailField(field:Field) {
		return p({html: field.options.detailNotes});
	}

	createTableColumn() {
		return  undefined;
	}
}

customFields.registerType(new Notes);