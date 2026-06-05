/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */


import {ButtonEventMap, Config, createComponent, OverlayToolbarButton, t, ToolbarItems} from "@intermesh/goui";
import {createlinkfield, CreateLinkField} from "./CreateLinkField";


export class CreateLinkButton extends OverlayToolbarButton {
	protected getTbarItems(): ToolbarItems[] {

		const createLinkField = createlinkfield({
			flex: 1,
			listeners: {
				setvalue: ({newValue}) => {
					this.text = newValue && newValue.length ? newValue.length : "";
				}
			}
		})

		this.on("open", () => {
			createLinkField.focus();
		})
		return [createLinkField];
	}
	constructor() {
		super();

		this.icon = "link";
		this.title = t("Create links");
	}
}

/**
 * Shorthand function to create {@link CreateLinkButton}
*/
export const createlinkbutton = (config?: Config<CreateLinkButton>) => createComponent(new CreateLinkButton(), config);