import {FormWindow} from "../../../components/index.js";
import {comp, fieldset, HiddenField, hiddenfield, searchbtn, t, tbar, textfield} from "@intermesh/goui";
import {GroupUserTable} from "./GroupUserTable.js";
import {moduleDS} from "../../../Modules.js";
import {client} from "../../../jmap/index.js";
import {GroupModuleTable} from "./GroupModuleTable.js";

export class GroupDialog extends FormWindow {
	private groupUserTbl: GroupUserTable;
	private readonly usersField: HiddenField;
	private readonly moduleTable!: GroupModuleTable;

	constructor() {
		super("Group");

		this.title = t("Group");

		this.height = 800;
		this.width = 1000;
		this.generalTab.cls = "vbox fit";

		this.generalTab.items.add(
			fieldset({},
				textfield({label: "Name", name: "name"})
			),
			this.usersField = hiddenfield({name: "users"}),

			fieldset({
					legend: t("Members"),
					cls: "scroll",
					flex: 1
				},

				this.groupUserTbl = new GroupUserTable(this.usersField)
			)
		);

		if (client.user.isAdmin) {
			this.moduleTable = new GroupModuleTable();

			this.cards.items.add(
				comp({
						title: t("Modules"),
						cls: "vbox fit"
					},
					tbar({},
						"->",
						searchbtn({
							listeners: {
								input: ({text}) => {
									this.moduleTable!.store.setFilter("text", {text: text});

									void this.moduleTable!.store.load();
								}
							}
						})
					),
					comp({
							cls: 'fit scroll bg-lowest',
							flex: 1
						},
						this.moduleTable
					)
				)
			);

			this.form.on("save", async () => {
				const groupId = this.form.currentId;
				if (groupId === undefined) {
					return;
				}

				const records = this.moduleTable!.store.data;
				for (const record of records) {
					if (record.permissions && record.permissions["null"] !== undefined) {
						record.permissions[groupId] = record.permissions["null"];
						delete record.permissions["null"];

						await moduleDS.update(record.moduleId ?? record.id, {
							permissions: record.permissions
						});
					}
				}

				this.moduleTable!.store.reload();
			});
		}


		this.addSharePanel();

		this.on("ready", (ev) => {
			this.groupUserTbl.store.setFilter('sort', {'groupMember': this.form.currentId});
			this.groupUserTbl.store.load();

			this.moduleTable.load(this.form.currentId!);
		});
	}
}