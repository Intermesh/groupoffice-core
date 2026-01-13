import {
	avatar, checkbox, checkboxcolumn,
	column,
	comp,
	Config,
	createComponent,
	datasourcestore,
	DataSourceStore,
	EntityID,
	Field,
	FieldValue,
	Filter,
	radio,
	searchbtn,
	select,
	small,
	t,
	Table,
	tbar
} from "@intermesh/goui";
import {client, jmapds} from "../../jmap/index.js";
import {entities} from "../../Entities.js";
import {SharePanel} from "../../permissions/index.js";
import {Module} from "../../Modules.js";
import {Module2} from "./Apps.js";


class GroupTable extends Table<DataSourceStore> {
	value: any;

	levels?:{ [key: string]: any }[]

	constructor(sharePanel: AppPermissionPanel, module:Module2) {


		const columns = [
			column({
				header: t("Name"),
				id: "name",
				resizable: true,
				renderer: async (columnValue, record, td, table, storeIndex) => {

					const first = record.users.slice(0, 3);

					const users = await jmapds("Principal").get(first);


					let memberStr = users.list.map(u => u.name).join(", ");

					const more = record.users.length - 3;

					if (more > 0) {
						memberStr += t(" and {count} more").replace('{count}', more);
					}

					let user;
					if (record.isUserGroupFor) {
						user = await jmapds("Principal").single(record.isUserGroupFor);
					}

					return comp({cls: "hbox"},
						avatar({
							displayName: record.name,
							backgroundImage: user && user.avatarId ? client.downloadUrl(user.avatarId) : undefined
						}),
						comp({flex: 1},
							comp({text: record.name}),
							small({text: memberStr})
						)
					)
				}
			}),

			checkboxcolumn({
				id: "mayRead",
				header: t("Use"),
				width: 200,
				renderer: (v, record) => {
					if(!this.value) {
						this.value = {};
					}
					return checkbox({
						value: this.value[record.id]?.rights["mayRead"] ?? false,
						listeners: {
							change: ({newValue}) => {

								if(!this.value[record.id]) {
									this.value[record.id] = {rights: {}};
								}
								this.value[record.id].rights["mayRead"] = newValue;

								console.log(this.value);
							}
						}
					})
				}
			})

		]
		for(let right of module.rights) {

			columns.push(checkboxcolumn({
				id: right,
				header: t(right, module.name, module.package),
				width: 200,
				renderer: (v, record) => {
					if(!this.value) {
						this.value = {};
					}
					return checkbox({
						value: this.value[record.id]?.rights[right] ?? false,
						listeners: {
							change: ({newValue}) => {

								if(!this.value[record.id]) {
									this.value[record.id] = {rights: {}};
								}
								this.value[record.id].rights[right] = newValue;

								console.log(this.value);
							}
						}
					})
				}
			}))
		}

		super(
			datasourcestore({
				dataSource: jmapds("Group"),

				queryParams: {
					limit: 20
				},
				filters: {
					groups: {
						hideUsers: true,
						hideGroups: false,
					},
					module: {
						inModulePermissions: module.model.id
					}

				},

				sort: [{
					property: "name"
				}]
			}),

			columns

			);

		this.fitParent = true;

		this.scrollLoad = true;

		this.style.width = "100%";

		this.cls = 'goui-share-panel';
	}

}


export class AppPermissionPanel extends Field {
	private readonly groupTable: GroupTable;

	public levels?:{ [key: string]: any }[]
	constructor(module:Module2) {
		super("div");

		this.name = "permissions";
		this.baseCls += " vbox";

		this.title = t("Permissions");

		this.groupTable = new GroupTable(this, module);

		this.items.add(
			tbar({},
				radio({
					type: "button",
					value: "groups",
					listeners: {

						change: ({newValue}) => {
							const f:Filter = {};

							switch (newValue) {
								case "both":
									f.hideUsers = false;
									f.hideGroups = false;
									break;

								case "users":
									f.hideUsers = false;
									f.hideGroups = true;
									break;

								case "groups":
									f.hideUsers = true;
									f.hideGroups = false;
									break;

							}

							this.groupTable.store.setFilter("groups", f);
							void this.groupTable.store.load();
						}
					},
					options: [
						{
							text: t("All"),
							value: "both"
						},
						{
							text: t("Users"),
							value: "users"
						},
						{
							text: t("Groups"),
							value: "groups"
						}
					]
				}),
				"->",
				searchbtn({
					listeners: {
						input: ( {text}) => {
							this.groupTable.store.setFilter("search", {text: text});
							void this.groupTable.store.load();
						}
					}
				}),
			),

			comp({cls: "scroll fit bg-lowest", flex: 1},
				this.groupTable
			)
		)
	}


	protected renderControl() {
		// empty
	}

	protected createLabel(): HTMLElement | void {

	}

	public setModule(module:any) {
		this.groupTable.value = module.permissions;
	}

	public load() {
		void this.groupTable.store.load();
	}

	get value(): FieldValue {
		return  this.groupTable.value;
	}

	set value(v) {
		this.groupTable.value = v;
	}

}

