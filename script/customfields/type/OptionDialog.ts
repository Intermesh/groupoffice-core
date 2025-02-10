import {
	btn,
	colorfield,
	fieldset,
	form,
	Form,
	select, StoreRecord,
	t,
	tbar,
	textfield,
	Tree,
	TreeRecord,
	Window
} from "@intermesh/goui";

export class OptionDialog extends Window {
	private form: Form;
	private selectedRow?: StoreRecord;


	constructor(tree: Tree) {
		super();

		this.title = t("Edit custom select option");

		this.width = 500;
		this.height = 500;

		this.modal = true;
		this.maximizable = false;
		this.draggable = false;
		this.resizable = true;

		this.items.add(
			this.form = form({
					flex: 1,
					handler: form1 => {
						const data = form1.value;

						const newNode:TreeRecord = {
							id: String(tree.data.length + 1),
							text: data.text,
							icon: "list",
							dataSet: {
								text: data.text,
								foregroundColor: data.foregroundColor,
								backgroundColor: data.backgroundColor,
								renderMode: data.renderMode
							},
							children: []
						}

						if(this.selectedRow !== undefined) {
							this.selectedRow.children.push(newNode);
							tree.expand()
						} else {
							const root = tree.store.get(0);

							if(root !== undefined)
								root.children!.push(newNode);
						}

						this.close();
					}
				},
				fieldset({},
					textfield({
						name: "text",
						label: t("Text"),
						required: true,
						width: 200
					}),
					colorfield({
						name: "foregroundColor",
						label: t("Text color")
					}),
					colorfield({
						name: "backgroundColor",
						label: t("Background color")
					}),
					select({
						name: "renderMode",
						label: t("Render mode"),
						options: [
							{value: "cell", name: t("Cell")},
							{value: "row", name: t("Row")}
						],
						width: 200
					})
				)
			),
			tbar({
					cls: "border-top"
				},
				"->",
				btn({
					text: t("Submit"),
					type: "submit",
					handler: () => {
						void this.form.submit();
					}
				})
			)
		)
	}

	public load(selectedRow: StoreRecord){
		this.selectedRow = selectedRow;
	}
}