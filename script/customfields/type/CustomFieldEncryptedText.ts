import {CustomFieldText} from "./CustomFieldText.js";
import {t} from "@intermesh/goui";
import {CustomField, customFields} from "../CustomFields.js";
import {EntityFilter} from "../../Modules.js";

export class CustomFieldEncryptedText extends CustomFieldText {
	constructor() {
		super(
			"EncryptedText",
			"lock",
			t("Encrypted text")
		);
	}

	getFilter(field:CustomField): EntityFilter | undefined {
		return undefined;
	}
}

customFields.registerType(new CustomFieldEncryptedText);