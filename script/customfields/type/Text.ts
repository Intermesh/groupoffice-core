import {MaterialIcon, t} from "@intermesh/goui";
import {TextDialog} from "./TextDialog.js";

export class Text {
	public name: string;
	public icon: MaterialIcon;
	public label: string;

	constructor() {
		this.name = "Text";

		this.label = t("Text");
		this.icon = "description";
	}

	public getDialog() {
		return new TextDialog();
	}

}