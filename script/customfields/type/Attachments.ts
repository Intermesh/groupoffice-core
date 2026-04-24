import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {AttachmentsDialog} from "./AttachmentsDialog.js";
import {customFields} from "../CustomFields.js";

export class Attachments extends Type {
	constructor() {
		super(
			"attachments",
			"attachment",
			t("Attachments")
		)
	}

	getDialog(): FieldDialog {
		return new AttachmentsDialog();
	}
}

customFields.registerType(new Attachments);