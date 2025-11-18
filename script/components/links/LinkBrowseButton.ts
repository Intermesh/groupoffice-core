import {Button, Config, createComponent, EntityID} from "@intermesh/goui";
import {linkDS} from "../../model/Link";
import {DetailPanel} from "../DetailPanel";
import {FormWindow} from "../FormWindow";
import {LinkBrowser} from "./LinkBrowser";

export class LinkBrowseButton extends Button {

	entityName?: string
	entityId?: EntityID
	constructor() {
		super();
		this.icon = "link";
		this.disabled = true;

		this.handler = ()=> {

			const lb = new LinkBrowser(this.entityName!, this.entityId!);
			lb.show();

		}


		this.on("render", () => {
			const cmp = this.findAncestor(cmp => {
				return cmp instanceof DetailPanel || cmp instanceof FormWindow;
			}) as DetailPanel;

			cmp.on("load", ({entity}) => {
				this.setEntity(cmp.entityName, entity.id);

			})

			cmp.on("reset", () => {
				this.disabled = true;
			})

		})
	}

	setEntity(entityName:string, entityId:EntityID) {
		this.entityName = entityName;
		this.entityId = entityId;
		this.disabled = false;

		linkDS.query({
			calculateTotal: true,
			limit: 1,
			filter: {entity: this.entityName, entityId: this.entityId}
		}).then(r => {
			this.text =  r.total ? r.total+"" : ""
		})
	}
}


/**
 * Shorthand function to create {@link LinkBrowseButton}
 */
export const linkbrowsebutton = (config?: Config<LinkBrowseButton>) => createComponent(new LinkBrowseButton(), config);