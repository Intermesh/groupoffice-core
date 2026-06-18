import {Text} from "./Text.js";
import {t} from "@intermesh/goui";
import {customFields, Field} from "../CustomFields.js";
import {EntityFilter} from "../../Modules.js";

export class EncryptedText extends Text {
	constructor() {
		super(
			"EncryptedText",
			"lock",
			t("Encrypted text")
		);
	}

	getFilter(field:Field): EntityFilter | undefined {
		return undefined;
	}
}

customFields.registerType(new EncryptedText);