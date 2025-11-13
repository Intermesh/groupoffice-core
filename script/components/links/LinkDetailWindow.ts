import {EntityID, Window} from "@intermesh/goui";
import {entities} from "../../Entities";
import {DetailPanel} from "../DetailPanel";
import {extjswrapper} from "../ExtJSWrapper";


export class LinkDetailWindow extends Window {
	private detail?: DetailPanel;
	constructor(private entityName:string) {
		super();

		this.closable = true;
		this.resizable = true;
		this.maximizable = true;
		this.collapsible = true;

		this.stateId = "go-link-detail-" + entityName;

		const entity = entities.get(entityName);

		this.title = entity.links[0].title;

		this.detail = entity.links[0].linkDetail();
		this.detail.flex = 1;

		if("getItemId" in this.detail) {
			this.items.add(extjswrapper({comp: this.detail, flex: 1}));
		} else {
			this.items.add(this.detail);
		}

		this.width = this.detail.width || 1000;
		this.height = this.detail.height || 700;
	}

	public load(id:EntityID) {
		return this.detail!.load(id);
	}
}