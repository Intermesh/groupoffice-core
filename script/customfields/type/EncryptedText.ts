import {Text} from "./Text.js";
import {t} from "@intermesh/goui";
import {customFields} from "../CustomFields.js";
import {Checkbox} from "./Checkbox.js";

export class EncryptedText extends Text {
	constructor() {
		super(
			"EncryptedText",
			"lock",
			t("Encrypted text")
		);
	}
}

customFields.registerType(new EncryptedText);