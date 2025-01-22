import {FieldDialog} from "../FieldDialog.js";
import {datefield, t} from "@intermesh/goui";

export class DateTimeDialog extends FieldDialog {
	constructor() {
		super();

		this.generalFieldset.items.add(
			datefield({
				name: "default",
				label: t("Default value"),
				withTime: true
			})
		)
	}
}