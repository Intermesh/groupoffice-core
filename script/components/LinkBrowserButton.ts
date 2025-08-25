import {Component, ComponentEventMap, Config, createComponent} from "@intermesh/goui";
import {DetailPanel} from "./DetailPanel.js";

export class LinkBrowserButton extends Component {
	constructor() {
		super();

		this.on("added", () => {
			const panel = this.findAncestor(cmp => {
				return cmp instanceof DetailPanel;
			}) as DetailPanel;

			// @ts-ignore ExtJS component
			(this.items.get(0)! as any).detailView = panel.detailView;

		})

		this.items.add(new go.links.LinkBrowserButton({
			// detailView: this.detailView
		}))
	}
}

export const linkbrowserbutton = (config?: Config<LinkBrowserButton>) => createComponent(new LinkBrowserButton(), config);