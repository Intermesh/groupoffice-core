import {AbstractSettingsPanel} from "./AbstractSettingsPanel";
import {
	btn,
	checkboxcolumn,
	column, datasourceform,
	datasourcestore,
	HiddenField,
	hiddenfield,
	menu,
	menucolumn,
	t,
	Table
} from "@intermesh/goui";
import {userSettingsPanels} from "./UserSettingsWindow.js";
import {groupDS, Principal, principalDS, User, userDS} from "../../auth/index.js";
import {modules} from "../../Modules.js";

userSettingsPanels.add(class Groups extends AbstractSettingsPanel {
	private groupTbl;
	private hiddenFld;
	constructor() {
		super("groups", t("Groups"), "group");

		this.hiddenFld = hiddenfield({
			name: "groups"
		})

		this.cls = "fit scroll bg-lowest";


		this.groupTbl = new Table(datasourcestore({
				queryParams: {limit: 20},
				dataSource: groupDS,
				sort: [{
					property: "name"
				}],
				filters: {
					default: {
						hideUsers: true,
						excludeEveryone: true
					}
				},
				onBeforeLoad: async (records) => {
					// load a max of 5 member usernames for each group
					await Promise.all(records.map(async (r:any) => {
						r.userCount = r.users.length;
						r.users = (await principalDS.get(r.users.slice(0, 5))).list;
						r.selected = this.hiddenFld.value && (this.hiddenFld.value as Array<any>).indexOf(r.id) > -1;

						console.log(r.selected);
					}));

					return records;
				}
			}),
			[
				column({
					header: t("Name"),
					id: "name",
					sortable: true,
					htmlEncode: false, // disable html encoding as we will use html in the renderer. Make sure to encode the data in there.
					renderer: (name, record, td, table1, storeIndex) => {
						// 2 line rendering
						let memberStr = record.users.map((u:Principal) => u.name).join(", ")
						const more = record.userCount - 5
						if(more > 0) {
							memberStr += t(" and {count} more").replace('{count}', more);
						}

						return `<h3>${name.htmlEncode()}</h3> <h4>${memberStr.htmlEncode()}</h4>`
					},
					width: 200
				}),

				checkboxcolumn({
					id: "selected",
					checkboxConfig:{disabled: !modules.get("core", "core")!.userRights.mayChangeUsers},
					listeners: {
						change: ev => {
							const groupId = ev.record.id, groupIds = this.hiddenFld.value as Array<string>;

							if(ev.checked) {
								this.hiddenFld.value = [...groupIds, groupId];
							} else {
								this.hiddenFld.value = groupIds.filter(id => id != groupId);
							}
						}
					}
				})
			])

		this.groupTbl.fitParent = true;

		this.items.add(this.groupTbl, this.form = datasourceform({dataSource: userDS}, this.hiddenFld));

		this.on("show", () => {
			this.groupTbl.store.load();
		})
	}

});