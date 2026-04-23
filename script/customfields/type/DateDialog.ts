import {datefield, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";

export class DateDialog extends FieldDialog {
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