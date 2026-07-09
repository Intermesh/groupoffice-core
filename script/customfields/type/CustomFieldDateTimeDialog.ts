import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {datetimefield, t} from "@intermesh/goui";

export class CustomFieldDateTimeDialog extends CustomFieldDialog {
	constructor() {
		super();

		this.generalFieldset.items.add(
			datetimefield({
				name: "default",
				label: t("Default value"),
				withTime: true
			})
		)
	}
}