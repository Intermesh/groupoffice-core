import {FieldDialog} from "../FieldDialog.js";
import {ArrayField, arrayfield, comp, containerfield, fieldset, hiddenfield, t} from "@intermesh/goui";
import {SelectOptionsTree} from "./SelectOptionsTree.js";
import {jmapds} from "../../jmap/index.js";

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

		this.form.on("load", (form, value) => {
			void this.selectOptionsTree.load(value.id);
		});

		this.form.on("beforesave", async (form , data) => {
			console.log(form);

			// data.dataType = {
			// 	options: this.selectOptionsTree.rootNode.children
			// }
			console.log(data);
		});
	}
}