import {Component, ComponentEventMap, Config, createComponent} from "@intermesh/goui";
import {DetailPanel} from "./DetailPanel";

export class AddButton extends Component {
	constructor() {
		super();

		this.on("added", (comp, index) => {
			const panel = this.findAncestor(cmp => {
				return cmp instanceof DetailPanel;
			}) as DetailPanel;

			// @ts-ignore
			(this.items.get(0)! as any).detailView = panel.detailView;

		})

		this.items.add(new go.detail.addButton({
			// detailView: this.detailView
		}))
	}
}

export const addbutton = (config?: Config<AddButton, ComponentEventMap<AddButton>>) => createComponent(new AddButton(), config);