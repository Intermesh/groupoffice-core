import {btn, comp, Component, EntityID, menu, t, tbar, Tree, tree, treecolumn, TreeRecord} from "@intermesh/goui";
import {OptionDialog} from "./OptionDialog.js";
import {jmapds} from "../../jmap/index.js";

export class SelectOptionsTree extends Component {
	private treeComponent: Tree;
	public treeData: TreeRecord[];
	private selectedRecord?: TreeRecord;
	public rootNode: TreeRecord;

	public fieldId?: EntityID;

	constructor() {
		super();

		this.rootNode = {
			id: "root",
			text: "Root",
			icon: "folder",
			check: true,
			children: []
		}

		this.treeData = [];

		this.treeData.push(this.rootNode);

		this.items.add(
			comp({
				cls: "pad",
				tagName: "h4",
				text: t("Warning: removing select options also removes the data from the records. You can disable select options by unchecking them.")
			}),
			this.treeComponent = tree({
				cls: "scroll",
				columns: [
					treecolumn({
						id: "text",
						defaultIcon: "format_list_bulleted"
					})
				],
				nodeProvider: () => this.treeData,
				rowSelectionConfig: {
					multiSelect: false,
					listeners: {
						selectionchange: (rowSelect) => {
							this.selectedRecord = rowSelect.getSelected()[0].record;
						}
					}
				},
				dropOn: true,
				draggable: true,
				listeners: {
					drop: (toComponent, toIndex, fromIndex, droppedOn, fromComp, dragDataSet) => {
						if (fromComp != toComponent) {
							return
						}

						const draggedRecord = (fromComp as Tree).store.get(fromIndex)!,
							droppenOnRecord = toComponent.store.get(toIndex)!;

						if (draggedRecord.id === droppenOnRecord.id || draggedRecord.id === this.rootNode.id) {
							return
						}

						const parent =
							draggedRecord.parentId !== null ? this.treeComponent.store.find(r => r.id === draggedRecord.parentId)! : this.rootNode;

						const index = parent.children!.indexOf(draggedRecord);
						if (index > -1) {
							parent.children!.splice(index, 1);
						}

						draggedRecord.parentId = droppenOnRecord.id;
						droppenOnRecord.children!.push(draggedRecord);

						void this.treeComponent.store.reload();
					},
					rowcontextmenu: (list, storeIndex, row, ev) => {
						const treeRecord = list.store.get(storeIndex)!;
						if (treeRecord.id == this.rootNode.id) {
							return
						}

						const contextMenu = menu({
								isDropdown: true
							},
							btn({
								icon: "edit",
								text: t("Edit"),
								handler: () => {
									const dlg = new OptionDialog();

									dlg.form.value = {
										text: treeRecord.text,
										foregroundColor: treeRecord.foregroundColor,
										backgroundColor: treeRecord.backgroundColor,
										renderMode: treeRecord.renderMode
									}

									dlg.form.handler = (form) => {
										Object.assign(treeRecord, {
											text: form.value.text,
											foregroundColor: form.value.foregroundColor,
											backgroundColor: form.value.backgroundColor,
											renderMode: form.value.renderMode
										});
									}

									dlg.show();
								}
							})
						);

						contextMenu.showAt(ev);
						ev.preventDefault();
					},
					checkchange: (tree, record, storeIndex, checked) => {
						record.enabled = checked;
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
						const dlg = new OptionDialog();

						dlg.form.handler = (form) => {
							const newNode: TreeRecord = {
								check: true,
								backgroundColor: form.value.backgroundColor,
								enabled: true,
								fieldId: Number(this.fieldId),
								foregroundColor: form.value.foregroundColor,
								parentId: null,
								renderMode: form.value.renderMode,
								sortOrder: 0,
								level: 0,
								text: form.value.text,
							}

							if (this.selectedRecord) {
								newNode.parentId = this.selectedRecord.id === this.rootNode.id ? null : this.selectedRecord.id;
								this.selectedRecord!.children!.push(newNode);
							} else {
								const rootNode = this.treeComponent.store.find((r) => r.id === this.rootNode.id)

								rootNode!.children!.push(newNode);
							}

							void this.treeComponent.store.reload();
						}

						dlg.show();
					}
				}),
				btn({
					icon: "delete",
					handler: () => {
						if (this.selectedRecord === undefined || this.selectedRecord.id === this.rootNode.id) {
							return
						}

						this.removeFromTreeData(this.treeData, this.selectedRecord.id!);

						this.selectedRecord = undefined;

						void this.treeComponent.store.reload();
					}
				})
			)
		)
	}

	public async load(fieldId: EntityID) {
		this.fieldId = fieldId;
		const field = await jmapds("Field").single(fieldId);

		this.rootNode.children = field!.dataType.options;
	}

	private removeFromTreeData(treeRecords: TreeRecord[], idToFind: string): boolean {
		for (let i = 0; i < treeRecords.length; i++) {
			if (treeRecords[i].id === idToFind) {
				treeRecords.splice(i, 1);
				return true
			}

			if (treeRecords[i].children) {
				const foundRecord: boolean = this.removeFromTreeData(treeRecords[i].children!, idToFind);
				if (foundRecord) {
					return true;
				}
			}
		}

		return false
	}
}