import {FieldDialog} from "../FieldDialog.js";
import {numberfield, t, textfield} from "@intermesh/goui";

export class TextDialog extends FieldDialog{
	constructor() {
		super();

		this.generalFieldset.items.add(
			textfield({
				id: "default",
				label: t("Default value")
			})
		);

		this.validationFieldset.items.add(
			numberfield({
				id: "options.maxLength",
				decimals: 0,
				value: 50,
				label: t("Maximum length")
			})
		);
	}
}