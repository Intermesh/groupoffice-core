import {btn, comp, Component, StoreRecord, t, tbar, tree, Tree, TreeRecord} from "@intermesh/goui";
import {OptionDialog} from "./OptionDialog.js";

export class SelectOptionsTree extends Component {
	private readonly tree:Tree;
	private selectedRow?: StoreRecord;

	constructor() {
		super();

		this.cls = "scroll fit"

		const treeData: TreeRecord[] = [
			{
				id: "1",
				text: "root",
				check: true,
				children: []
			}
		]

		this.items.add(
			comp({
					flex: 1,
					cls: "vbox fit"
				},
				comp({
					cls: "pad",
					tagName: "h4",
					text: t("Warning: removing select options also removes the data from the records. You can disable select options by unchecking them.")
				}),
				this.tree = tree({
					flex: 1,
					data: treeData,
					draggable: true,
					dropBetween: true,
					rowSelectionConfig: {
						listeners: {
							rowselect: (rowSelect, selectedRow) => {
								this.selectedRow = selectedRow.record;
								console.log(selectedRow);
							}
						}
					}
				}),
				tbar({
						cls: "border-top"
					},
					"->",
					btn({
						icon: "add",
						handler: () => {
							const dlg = new OptionDialog(this.tree);

							if (this.selectedRow !== undefined)
								dlg.load(this.selectedRow);

							dlg.show();
						}
					}),
					btn({
						icon: "delete",
						handler: () => {
							if(this.selectedRow) {
								this.tree.store.remove(this.selectedRow.id)
								this.selectedRow = undefined;
							}
						}
					})
				)
			)
		)
	}
}