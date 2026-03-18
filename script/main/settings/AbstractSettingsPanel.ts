import {Component, DataSourceForm, MaterialIcon} from "@intermesh/goui";
import {User} from "../../auth/index.js";

export abstract class AbstractSettingsPanel extends Component {
	protected user?: User;

	protected form?: DataSourceForm
	constructor(itemId: string, title: string, icon:MaterialIcon) {
		super();
		this.cls = 'scroll fit';
		this.itemId = itemId;
		this.title = title;
		this.dataSet.icon = icon;
	}

	public async save() : Promise<any> {
		if(this.form){
			return this.form.submit();
		}
		return Promise.resolve();
	}

	public async load(user:User) :Promise<any> {
		this.user = user;
		if(this.form) {
			this.form.value = user;
			this.form.currentId = user.id;
		}
		return Promise.resolve();
	}
}