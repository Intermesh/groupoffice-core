import {Component} from "@intermesh/goui";
import {User} from "../../auth/index.js";

export abstract class AbstractSettingsPanel extends Component {

	constructor(itemId: string, title: string) {
		super();

		this.itemId = itemId;
		this.title = title;
	}

	public async save() : Promise<any> {
		return Promise.resolve();
	}

	public async load(user:User) :Promise<any> {
		return Promise.resolve();
	}
}