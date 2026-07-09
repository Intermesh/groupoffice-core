import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {comp, t} from "@intermesh/goui";
import {CustomFieldSelectOptionsTree} from "./CustomFieldSelectOptionsTree.js";

export class CustomFieldSelectDialog extends CustomFieldDialog {
	private readonly selectOptionsTree: CustomFieldSelectOptionsTree;

	constructor() {
		super();

		this.selectOptionsTree = new CustomFieldSelectOptionsTree();

		this.cards.items.add(
			comp({
					cls: "scroll",
					title: t("Options")
				},
				this.selectOptionsTree
			)
		)

		this.form.on("load", ({data}) => {
			void this.selectOptionsTree.load(data.id);
		});
	}
}