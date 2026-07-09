import {datefield, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";

export class CustomFieldDateDialog extends CustomFieldDialog {
	constructor() {
		super();

		this.generalFieldset.items.add(
			datefield({
				name: "default",
				label: t("Default value")
			})
		)
	}
}