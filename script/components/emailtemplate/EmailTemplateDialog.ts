import {FormWindow} from "../FormWindow";
import {fieldset, htmlfield, t, textfield} from "@intermesh/goui";
import {languagefield} from "../form";

export class EmailTemplateDialog extends FormWindow {
	private hideLanguage: boolean;

	constructor() {
		super("EmailTemplate");
		this.title = t("Email template");
		this.width = 1000;
		this.height = 800;
		this.maximizable = true;
		this.resizable = true;
		this.collapsible = false;
		this.closable = true;
		this.hideLanguage = false;

		this.generalTab.items.add(
			fieldset({},
				textfield({
					name: "name",
					required: true,
					label: t("Name"),
				}),
				languagefield({hidden: this.hideLanguage, required: !this.hideLanguage}),
				textfield({
					name: "subject",
					required: true,
					label: t("Subject"),
				}),
				htmlfield({
					name: "body",
					label: t("Body"),
					required: true
				}),
				textfield({
					readOnly: true,
					name: "key"
				}),
				textfield({
					name: "moduleId",
					readOnly: true
				})
			)
		);

		this.form.on("load", ({data}) => this.title = data.name);
	}

}