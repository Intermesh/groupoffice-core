import {CustomFieldType} from "./CustomFieldType.js";
import {t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldAttachmentsDialog} from "./CustomFieldAttachmentsDialog.js";
import {customFields} from "../CustomFields.js";

export class CustomFieldAttachments extends CustomFieldType {
	constructor() {
		super(
			"attachments",
			"attachment",
			t("Attachments")
		)
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldAttachmentsDialog();
	}
}

customFields.registerType(new CustomFieldAttachments);