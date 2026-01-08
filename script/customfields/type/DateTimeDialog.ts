import {FieldDialog} from "../FieldDialog.js";
import {datetimefield, t} from "@intermesh/goui";

export class DateTimeDialog extends FieldDialog {
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