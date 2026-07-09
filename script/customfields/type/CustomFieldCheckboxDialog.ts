import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {checkbox, t} from "@intermesh/goui";

export class CustomFieldCheckboxDialog extends CustomFieldDialog {
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