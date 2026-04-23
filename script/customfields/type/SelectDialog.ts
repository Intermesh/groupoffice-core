import {FieldDialog} from "../FieldDialog.js";
import {comp, t} from "@intermesh/goui";
import {SelectOptionsTree} from "./SelectOptionsTree.js";

export class SelectDialog extends FieldDialog {
	private readonly selectOptionsTree: SelectOptionsTree;

	constructor() {
		super();

		this.selectOptionsTree = new SelectOptionsTree();

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