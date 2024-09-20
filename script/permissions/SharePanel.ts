import {
	avatar,
	column,
	comp,
	ComponentEventMap,
	Config,
	createComponent,
	datasourcestore,
	DataSourceStore,
	Field,
	FieldValue, Filter,
	radio,
	searchbtn,
	select,
	small,
	t,
	Table,
	tbar
} from "@intermesh/goui";
import {client, jmapds} from "../jmap/index.js";
import {entities} from "../Entities.js";


class GroupTable extends Table<DataSourceStore> {
	value: any;

	levels?:{ [key: string]: any }[]

	constructor(sharePanel: SharePanel) {
		super(
			datasourcestore({
				dataSource: jmapds("Group"),

				queryParams: {
					filter: {
						hideUsers: true,
						hideGroups: false
					},
				},

				sort: [{
					property: "name"
				}]
			}),
			[
				column({
					header: t("Name"),
					id: "name",
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

				column({
					id: "level",
					width: 120,
					header: t("Level"),
					renderer: (columnValue, record, td, table, storeIndex) => {
						return select({
							value: this.value ? this.value[record.id] ?? undefined : undefined,
							options: sharePanel.levels || [
								{value: "",name: ""},
								{value: 10,name: t("Read")},
								{value: 20,name: t("Create")},
								{value: 30,name: t("Write")},
								{value: 40,name: t("Delete")},
								{value: 50,name: t("Manage")}
							],
							listeners: {
								change: (field, newValue, oldValue) => {
									if(!this.value) {
										this.value = {};
									}
									this.value[record.id] = newValue ? newValue : null;
								}
							}
						});
					}
				})

			]);

		this.fitParent = true;

		this.cls = 'goui-share-panel';
	}

	setEntity(name: string, id?: string) {
		this.store.setFilter("entity", {inAcl: {entity: name, id: id}});

		if (!id) {
			// if ID is empty then load default ACKL
			entities.get(name).then(entity => {
				this.value = entity.defaultAcl;
			});

		}
	}
}


export class SharePanel extends Field {
	private readonly groupTable: GroupTable;

	public levels?:{ [key: string]: any }[]
	constructor() {
		super("div");

		this.name = "acl";
		this.baseCls += " vbox";

		this.title = t("Permissions");

		this.groupTable = new GroupTable(this);

		this.items.add(
			tbar({},
				radio({
					type: "button",
					value: "groups",
					listeners: {

						change: (field, newValue, oldValue) => {
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
						input: (sender, text) => {
							this.groupTable.store.setFilter("search", {text: text});
							void this.groupTable.store.load();
						}
					}
				}),
			),

			comp({cls: "scroll fit", flex: 1},
				this.groupTable
			)
		)
	}


	protected createLabel(): HTMLElement | void {

	}

	public setEntity(name: string, id?: string) {
		this.groupTable.setEntity(name, id);
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


/**
 * Shorthand function to create {@see SharePanel}
 *
 * @param config
 */
export const sharepanel = (config?: Config<SharePanel, ComponentEventMap<SharePanel>>) => createComponent(new SharePanel(), config);