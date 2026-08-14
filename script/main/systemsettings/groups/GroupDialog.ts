import {FormWindow} from "../../../components/index.js";
import {
	autocompletechips,
	checkbox,
	CheckboxColumn,
	checkboxcolumn,
	checkboxselectcolumn,
	column,
	comp,
	DataSourceStore,
	datasourcestore,
	fieldset,
	HiddenField,
	hiddenfield,
	searchbtn,
	store,
	t,
	Table,
	table,
	tbar,
	textfield
} from "@intermesh/goui";
import {GroupUserTable} from "./GroupUserTable.js";
import {moduleDS} from "../../../Modules.js";
import {client} from "../../../jmap/index.js";

export class GroupDialog extends FormWindow {
	private groupUserTbl: GroupUserTable;
	private readonly usersField: HiddenField;
	private moduleTable: Table<DataSourceStore> | undefined;

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
			this.cards.items.add(
				fieldset({
						title: t("Modules"),
						cls: "fit"
					},
					comp({
							cls: 'fit scroll'
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

						this.moduleTable = table({
							fitParent: true,
							store: datasourcestore({
								dataSource: moduleDS
							}),
							columns: [
								column({
									id: "title",
									header: t("Name")
								}),
								column({
									id: "package",
									header: t("Package")
								}),
								column({
									id: "permissions",
									header: t("Permissions"),
									renderer: (columnValue, record, td) => {
										const groupKey = this.form.currentId ?? "null";
										const entry = columnValue ? columnValue[groupKey] : undefined;
										const moduleId = record.moduleId ?? record.id;

										if (!entry) {
											return "-";
										}

										if (this.form.currentId == "1") {
											const allRights = Object.keys(entry.rights)
												.filter(r => r !== 'mayRead' && entry.rights[r])
												.map(r => t(r));
											return allRights.length ? allRights.join(', ') : t("Use");
										}
										const rightKeys = (record.rights as string[]).filter(r => r !== 'mayRead');

										const field = autocompletechips({
											list: table({
												fitParent: true,
												headers: false,
												store: store({
													data: rightKeys.map(name => ({
														id: name,
														name: t(name)
													}))
												}),
												columns: [
													checkboxselectcolumn(),
													column({id: "name", sortable: false, resizable: false})
												],
												rowSelectionConfig: {multiSelect: true}
											}),
											value: rightKeys.filter(name => !!entry.rights[name]),
											chipRenderer: async (chip, value) => {
												chip.text = t(value);
											}
										});

										field.on("change", async ({newValue}) => {
											const groupKey = this.form.currentId ?? "null";

											const moduleGetResponse = await moduleDS.get([moduleId]);
											if (moduleGetResponse.list) {
												const permissions = moduleGetResponse.list[0].permissions;
												const freshEntry: any = permissions[groupKey] ?? entry;

												const updatedRights = {
													...freshEntry.rights,
													...Object.fromEntries(
														rightKeys.map(key => [key, (newValue as string[]).includes(key)])
													)
												};

												permissions[groupKey] = {
													...freshEntry,
													rights: updatedRights
												};

												await moduleDS.update(moduleId, {permissions});
												this.moduleTable!.store.reload();
											}
										});

										return field;
									}
								}),
								checkboxcolumn({
									id: "selected",
									header: "",
									width: 40,
									resizable: false,
									sortable: false,

									renderer: (val, record, td, table, rowIndex, col) => {
										const groupKey = this.form.currentId ?? "null";
										const checked = !!(record.permissions && record.permissions[groupKey]);
										const disabled = record.package === "core" && this.form.currentId === "2";

										return checkbox({
											value: checked,
											disabled: disabled,
											listeners: {
												change: async ({target, newValue}) => {
													let permissions = record.permissions || {};

													if (newValue) {
														if (!permissions[groupKey]) {
															permissions[groupKey] = {rights: {}};
														}
													} else {
														delete permissions[groupKey];
													}

													await moduleDS.update(record.moduleId ?? record.id, {permissions});

													(col as CheckboxColumn).fire("change", {
														checkbox: target,
														checked: newValue,
														record,
														storeIndex: rowIndex
													});

													this.moduleTable!.store.reload();
												}
											}
										});
									}
								}),
							]
						})
					)
				)
			);

			this.moduleTable.store.load();

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
		});
	}
}