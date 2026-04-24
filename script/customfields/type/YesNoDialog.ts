import {FieldDialog} from "../FieldDialog.js";
import {
	select,
	t
} from "@intermesh/goui";

export class YesNoDialog extends FieldDialog {
	constructor() {
		super();

		this.generalFieldset.items.add(
			select({
				name: "default",
				label: t("Default"),
				options: [
					{value: 1, name: t("Yes")},
					{value: -1, name: t("No")},
				]
			})
		)
	}
}