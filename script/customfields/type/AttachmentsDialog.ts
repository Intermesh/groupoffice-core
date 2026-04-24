import {FieldDialog} from "../FieldDialog.js";
import {comp, fieldset, radio, t} from "@intermesh/goui";

export class AttachmentsDialog extends FieldDialog {
	constructor() {
		super();

		this.generalTab.items.add(
			fieldset({},
				comp({
					tagName: "h4",
					text: t("Options")
				}),
				radio({
					name: "options.accept",
					label: t("File types"),
					value: "*/*",
					type: "box",
					options: [
						{text: t("All"), value: "*/*"},
						{text: t("Images"), value: "image/*"},
						{text: t("Video"), value: "video/*"},
						{text: t("Documents"), value: ".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf"},
						{text: t("PDFs"), value: "application/pdf"}
					]
				}),
				radio({
					name: "options.multiFileSelect",
					label: t("File selection"),
					value: "false",
					type: "box",
					options: [
						{text: t("Single"), value: "false"},
						{text: t("Multiple"), value: "true"}
					]
				})
			)
		)
	}
}