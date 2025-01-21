import {FieldDialog} from "../FieldDialog.js";
import {checkbox, t} from "@intermesh/goui";

export class CheckboxDialog extends FieldDialog {
	constructor() {
		super();

		this.generalFieldset.items.add(
			checkbox({
				name: "default",
				label: t("Default")
			})
		);
	}
}