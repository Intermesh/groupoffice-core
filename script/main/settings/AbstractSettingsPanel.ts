import {Component} from "@intermesh/goui";

export abstract class AbstractSettingsPanel extends Component {

	constructor(itemId: string, title: string) {
		super();

		this.itemId = itemId;
		this.title = title;
	}

	public async save() {
		return Promise.resolve();
	}
}