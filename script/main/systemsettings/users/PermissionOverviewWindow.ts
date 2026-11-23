import {btn, column, ComboBox, comp, Component, Format, select, SelectField, store, Store, t, table, tbar, Window} from "@intermesh/goui";
import {client} from "../../../jmap/index.js";
import {modules} from "../../../Modules.js";
import {groupcombo} from "../../../components/GroupCombo.js";
import {AclLevel} from "../../../auth/index.js";

interface AclOverviewRecord {
	level: AclLevel,
	typeId: number,
	type: string,
	entityId: number,
	module: string,
	package: string | null,
	/**
	 * The user ID when the group is the personal group of a user, otherwise 0
	 */
	userGroup: number,
	username: string,
	/**
	 * Only set when less than the maximum number of rows was found
	 */
	name?: string
}

/**
 * The server returns at most this number of rows, and only looks up the names of the items when there are less
 */
const MAX_ROWS = 2000;

/**
 * Shows the permissions that users and groups have on items, with filters on group, module and users or groups
 *
 * Only for administrators (core/Acl/overview)
 */
export class PermissionOverviewWindow extends Window {
	private readonly store: Store<AclOverviewRecord>;
	private readonly groupFld: ComboBox;
	private readonly moduleFld: SelectField;
	private readonly typeFld: SelectField;
	private readonly limitNotice: Component;

	constructor() {
		super();

		this.title = t("Permission overview");
		this.width = 1000;
		this.height = 600;
		this.maximizable = true;
		this.resizable = true;
		this.cls = "vbox";

		const levels: Record<number, string> = {
			[AclLevel.READ]: t("Read only"),
			[AclLevel.CREATE]: t("Read and Create only"),
			[AclLevel.WRITE]: t("Write"),
			[AclLevel.DELETE]: t("Write and delete"),
			[AclLevel.MANAGE]: t("Manage")
		};

		this.store = store<AclOverviewRecord>({data: []});

		this.groupFld = groupcombo({
			label: t("Group"),
			buttons: [
				btn({
					icon: "clear",
					handler: () => {
						this.groupFld.value = undefined;
						void this.load();
					}
				})
			],
			listeners: {
				change: () => void this.load()
			}
		});

		this.moduleFld = select({
			label: t("Module"),
			options: [{value: "", name: t("All")}].concat(
				modules.getAll()
					.filter(m => m.enabled)
					.sort((a, b) => a.title.localeCompare(b.title))
					.map(m => ({value: m.id + "", name: m.title}))
			),
			value: "",
			listeners: {
				change: () => void this.load()
			}
		});

		this.typeFld = select({
			label: t("Type"),
			options: [
				{value: "both", name: t("All")},
				{value: "users", name: t("Users")},
				{value: "groups", name: t("Groups")}
			],
			value: "both",
			listeners: {
				change: () => void this.load()
			}
		});

		this.items.add(
			tbar({cls: "border-bottom"},
				this.groupFld,
				this.moduleFld,
				this.typeFld
			),
			this.limitNotice = comp({
				tagName: "p",
				cls: "notice pad",
				hidden: true,
				text: t("Only the first 2000 permissions are shown, without names. Use the filters to see the names.")
			}),
			comp({flex: 1, cls: "scroll"},
				table({
					store: this.store,
					columns: [
						column({
							id: "username",
							header: t("User") + " / " + t("Group"),
							width: 200,
							htmlEncode: false,
							renderer: (v, record) =>
								'<i class="icon">' + (record.userGroup ? "person" : "group") + '</i> ' + Format.htmlEncode(v ?? "")
						}),
						column({
							id: "module",
							header: t("Module"),
							width: 160,
							renderer: (v, record) => (record.package ? modules.get(record.package, v)?.title : undefined) ?? v
						}),
						column({
							id: "type",
							header: t("Type"),
							width: 160
						}),
						column({
							id: "entityId",
							header: t("Item ID"),
							width: 100,
							align: "right"
						}),
						column({
							id: "name",
							header: t("Name"),
							resizable: true,
							width: 240
						}),
						column({
							id: "level",
							header: t("Level"),
							width: 180,
							renderer: (v) => levels[v] ?? v
						})
					]
				})
			)
		);

		this.on("render", () => {
			void this.load();
		});
	}

	private async load() {
		const conditions: Record<string, any>[] = [{type: this.typeFld.value}];
		if (this.groupFld.value) {
			conditions.push({groupId: this.groupFld.value});
		}
		if (this.moduleFld.value) {
			conditions.push({moduleId: this.moduleFld.value});
		}

		this.mask();
		try {
			const response = await client.jmap("core/Acl/overview", {filter: {conditions}});
			this.store.loadData(response.list, false);
			this.limitNotice.hidden = response.list.length < MAX_ROWS;
		} catch (e) {
			void Window.error(e);
		} finally {
			this.unmask();
		}
	}
}
