import {Button, Config, createComponent, EntityID} from "@intermesh/goui";
import {linkDS} from "../model/Link";

export class LinkBrowseButton extends Button {

	entity?: string
	entityId?: EntityID
	constructor() {
		super();
		this.icon = "link";

		this.handler = ()=> {
			const lb = new go.links.LinkBrowser({
				entity: this.entity,
				entityId: this.entityId
			});

			lb.show();
		}
	}

	setEntity(entity:string, entityId:EntityID) {
		this.entity = entity;
		this.entityId = entityId;

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