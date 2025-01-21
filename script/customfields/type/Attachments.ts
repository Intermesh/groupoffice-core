import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {AttachmentsDialog} from "./AttachmentsDialog.js";

export class Attachments extends Type {
	constructor() {
		super();

		this.label = t("Attachments");
		this.icon = "attachment";
		this.name = "Attachments";
	}

	getDialog(): FieldDialog {
		return new AttachmentsDialog();
	}
}