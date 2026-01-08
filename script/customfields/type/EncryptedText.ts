import {Text} from "./Text.js";
import {t} from "@intermesh/goui";
import {customFields} from "../CustomFields.js";
import {Checkbox} from "./Checkbox.js";

export class EncryptedText extends Text {
	constructor() {
		super();

		this.name = "EncryptedText";
		this.label = t("Encrypted text");
		this.icon = "lock";
	}
}

customFields.registerType(EncryptedText);