import {CustomFieldType} from "./CustomFieldType.js";
import {t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {customFields} from "../CustomFields.js";

export class CustomFieldData extends CustomFieldType {
	constructor() {
		super("Data", "storage", t("Data"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldDialog();
	}
}


customFields.registerType(new CustomFieldData);