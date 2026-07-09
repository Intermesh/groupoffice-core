import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {select, t} from "@intermesh/goui";

export class CustomFieldYesNoDialog extends CustomFieldDialog {
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