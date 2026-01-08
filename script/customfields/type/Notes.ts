import {Type} from "./Type.js";
import {FieldDialog} from "../FieldDialog.js";
import {t} from "@intermesh/goui";
import {NotesDialog} from "./NotesDialog.js";

export class Notes extends Type {
	constructor() {
		super();

		this.name = "Notes";
		this.label = t("Notes");
		this.icon = "description";
	}

	getDialog(): FieldDialog {
		return new NotesDialog();
	}
}