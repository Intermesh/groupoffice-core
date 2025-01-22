import {Text} from "./Text.js";
import {t} from "@intermesh/goui";

export class EncryptedText extends Text {
	constructor() {
		super();

		this.name = "EncryptedText";
		this.label = t("Encrypted text");
		this.icon = "lock";
	}
}