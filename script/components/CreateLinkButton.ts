/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */


import {ButtonEventMap, Config, createComponent, OverlayToolbarButton, t} from "@intermesh/goui";
import {createlinkfield, CreateLinkField} from "./CreateLinkField";


export class CreateLinkButton extends OverlayToolbarButton {
	readonly createLinkField: CreateLinkField;

	constructor() {
		super();

		this.icon = "link";

		this.title = t("Create links");

		this.createLinkField = createlinkfield({
			flex: 1,
			listeners: {
				setvalue: (field, newValue) => {
					this.text = newValue && newValue.length ? newValue.length : "";
				}
			}
		})

		this.items.add(this.createLinkField)

		this.on("open", () => {
			this.createLinkField.focus();
		})
	}
}

/**
 * Shorthand function to create {@link CreateLinkButton}
*/
export const createlinkbutton = (config?: Config<CreateLinkButton, ButtonEventMap<CreateLinkButton>>) => createComponent(new CreateLinkButton(), config);