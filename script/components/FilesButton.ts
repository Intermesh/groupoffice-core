import {Component, ComponentEventMap, Config, createComponent} from "@intermesh/goui";
import {DetailPanel} from "./DetailPanel.js";

export class FilesButton extends Component {
	constructor() {
		super();

		this.on("added", () => {
			const panel = this.findAncestor(cmp => {
				return cmp instanceof DetailPanel;
			}) as DetailPanel;

			// @ts-ignore ExtJS component
			(this.items.get(0)! as any).detailView = panel.detailView;

		})

		this.items.add(new GO.files.DetailFileBrowserButton({
			// detailView: this.detailView
		}))
	}
}

export const filesbutton = (config?: Config<FilesButton>) => createComponent(new FilesButton(), config);