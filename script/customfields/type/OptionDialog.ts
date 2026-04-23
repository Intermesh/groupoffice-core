import {
	btn,
	colorfield,
	fieldset,
	form,
	Form,
	select,
	t,
	tbar,
	textfield,
	Tree,
	Window
} from "@intermesh/goui";

export class OptionDialog extends Window {
	public form: Form;

	constructor() {
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
					flex: 1
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
						this.close();
					}
				})
			)
		)
	}
}