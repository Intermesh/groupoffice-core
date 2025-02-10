import {FieldDialog} from "../FieldDialog.js";
import {comp, t} from "@intermesh/goui";
import {SelectOptionsTree} from "./SelectOptionsTree.js";

export class SelectDialog extends FieldDialog {
	constructor() {
		super();

		this.cards.items.add(
			comp({
					title: t("Options"),
					cls: "scroll fit"
				},
				new SelectOptionsTree()
			)
		)
	}
}