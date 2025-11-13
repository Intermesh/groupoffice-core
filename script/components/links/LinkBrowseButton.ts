import {Button, Config, createComponent, EntityID} from "@intermesh/goui";
import {linkDS} from "../../model/Link";
import {DetailPanel} from "../DetailPanel";
import {FormWindow} from "../FormWindow";

export class LinkBrowseButton extends Button {

	entity?: string
	entityId?: EntityID
	constructor() {
		super();
		this.icon = "link";
		this.disabled = true;

		this.handler = ()=> {
			const lb = new go.links.LinkBrowser({
				entity: this.entity,
				entityId: this.entityId
			});

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

	setEntity(entity:string, entityId:EntityID) {
		this.entity = entity;
		this.entityId = entityId;
		this.disabled = false;

		linkDS.query({
			calculateTotal: true,
			limit: 1,
			filter: {entity: this.entity, entityId: this.entityId}
		}).then(r => {
			this.text =  r.total ? r.total+"" : ""
		})
	}
}


/**
 * Shorthand function to create {@link LinkBrowseButton}
 */
export const linkbrowsebutton = (config?: Config<LinkBrowseButton>) => createComponent(new LinkBrowseButton(), config);