/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */


import {ButtonEventMap, Config, createComponent, DataSourceForm, OverlayToolbarButton, t, ToolbarItems} from "@intermesh/goui";
import {createlinkfield, CreateLinkField} from "./CreateLinkField";
import {linkDS} from "../../model/Link";


export class CreateLinkButton extends OverlayToolbarButton {
	private _createLinkField?: CreateLinkField;

	public get createLinkField() {
		if(!this._createLinkField) {
			this._createLinkField = createlinkfield({
				flex: 1,
				listeners: {
					setvalue: ({newValue}) => {
						this.text = newValue && newValue.length ? newValue.length : "";
					}
				}
			})

			this.on("open", () => {
				this._createLinkField!.focus();
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