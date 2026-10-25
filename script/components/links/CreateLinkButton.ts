/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */


import {ButtonEventMap, Config, createComponent, OverlayToolbarButton, t} from "@intermesh/goui";
import {createlinkfield, CreateLinkField} from "./CreateLinkField";
import {linkDS} from "../../model/Link";


export class CreateLinkButton extends OverlayToolbarButton {
	readonly createLinkField: CreateLinkField;

	constructor() {
		super();

		this.icon = "link";

		this.title = t("Create links");

		this.createLinkField = createlinkfield({
			flex: 1,
			listeners: {
				setvalue: ({newValue}) => {
					this.text = newValue && newValue.length ? newValue.length : "";
				}
			}
		})

		this.items.add(this.createLinkField)

		this.on("open", () => {
			this.createLinkField.focus();
		})

			const f = this.findAncestorByType(DataSourceForm);
			if (f) {
				f.on("save", () => {

					this._createLinkField!.value.forEach((v: any) => {
						void linkDS.create({
							fromId: f.currentId,
							fromEntity: f.dataSource.id,
							toId: v.entityId,
							toEntity: v.entityName
						})
					});

				}, {unshift: true});
			}
		}

		return this._createLinkField;
	}
	protected getTbarItems(): ToolbarItems[] {

		return [this.createLinkField];
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