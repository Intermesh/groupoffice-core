import {
	ArrayUtil, AutocompleteChips,
	autocompletechips,
	btn,
	checkbox,
	checkboxselectcolumn,
	column, combobox, comp,
	containerfield,
	datasourceform, EntityID,
	fieldset,
	store,
	t,
	table,
	tbar,
	textfield,
	Window
} from "@intermesh/goui";
import {moduleDS, modules} from "../../../Modules.js";
import {dateformatfield, firstweekdayfield, timeformatfield, timezonefield} from "../../settings/index.js";
import {groupchips} from "../../../components/GroupChips.js";
import {main} from "../../Main.js";
import {jmapds} from "../../../jmap/index.js";
import {entities} from "../../../Entities.js";
import {AclLevel} from "../../../auth/index.js";



export class UserDefaultsWindow extends Window {
	private form;
	private visileToField!: AutocompleteChips;
	constructor() {
		super();

		this.title = t("User defaults");
		this.modal = true;

		this.width = 1000;
		this.height = 700;

		this.resizable = true;

		this.items.add(
			this.form = this.createForm()
		)

		const mod = modules.get("core", "core")!;

		this.form.value = mod;
		this.form.currentId = mod.id;
		this.form.trackReset();
	}

	private createForm() {

		const panels = ArrayUtil.multiSort(main.getPanels(), [{property:"title"}]);

		return datasourceform({
			dataSource: moduleDS,
			patchMode: true,
			cls: "fit vbox",
			listeners:{
				save: async () => {

					const groupEntity = entities.get("Group")!, oldGroups:Record<EntityID,number> = groupEntity.defaultAcl!, newGroups: Record<EntityID,number> = {};

					(this.visileToField.value as EntityID[]).forEach((groupId:EntityID) => {
							newGroups[groupId] = oldGroups[groupId] ?? AclLevel.READ;
					})

					const coreMod = modules.get("core", "core");
					await moduleDS.update(coreMod!.id, {["entities/Group/defaultAcl"]: newGroups});

					//Hackish but the defaultAcl does not update automatically unfortunately
					groupEntity.defaultAcl = newGroups;

					this.close()
				}
			}
		},

			containerfield({
				keepUnknownValues: false,
				name: "settings",
				cls: "scroll flow",
				flex: 1
			},

				comp({cls: "flow"},
					fieldset({legend: t("Regional"), flex: 1, minWidth:300},
						timezonefield({name: "defaultTimezone"}),
						dateformatfield({name: "defaultDateFormat"}),
						timeformatfield({name: "defaultTimeFormat"}),
						checkbox({name: 'defaultShortDateInList',label: t("Use short format for date and time in lists")}),
						firstweekdayfield({name: "defaultFirstWeekday"})
					),

					fieldset({legend: t('Formatting'), flex:1,minWidth:200},
						textfield({name:'defaultListSeparator', label: t('List separator')}),
						textfield({name:'defaultTextSeparator', label: t('Text separator')}),
						textfield({name:'defaultThousandSeparator', label: t('Thousand separator')}),
						textfield({name:'defaultDecimalSeparator', label: t('Decimal separator')}),
						textfield({name:'defaultCurrency', label: t('Currency')}),
					)
				),


				comp({cls: "flow"},

					fieldset({legend: t("User interface"), minWidth: 400, flex: 1},

						checkbox({
							name: 'defaultConfirmOnMove',
							label: t("Show confirmation dialog on move"),
							hint: t("When this is on and items are moved by dragging, confirmation is requested")
						}),

						autocompletechips({
							sortable: true,
							name: "defaultPinnedTabs",
							label: t("Pinned tabs"),
							list: table({
								fitParent: true,
								headers: false,
								store: store(),
								rowSelectionConfig: {
									multiSelect: true
								},
								columns: [
									checkboxselectcolumn(),
									column({
										header: t("Title"),
										id: "title"
									})
								]
							}),
							chipRenderer: (chip, value) => {
								const record = panels.find(p => p.id == value);
								chip.text = record?.title ?? value;
							},
							pickerRecordToValue(field, record): any {
								return record.id;
							},
							listeners: {
								autocomplete: ({target, input}) => {
									if(input) {
										const filtered = panels.filter(r => r.title.toLowerCase().startsWith(input.toLowerCase()));
										target.list.store.loadData(filtered, false);
									} else {
										target.list.store.loadData(panels, false);
									}
								}
							},
						}),
					),

					fieldset({legend: t("Permissions"), minWidth: 400, flex: 1},

						groupchips({
							name: "defaultGroups",
							hint: t("Users will automatically be added to these groups", "users", "core"),
						}),

						...(modules.get("community","addressbook") ? [combobox({
							label: t("User addressbook", "community", "addressbook"),
							name: "userAddressBookId",
							dataSource: jmapds("AddressBook")
						})] : []),


						this.visileToField = groupchips({
							groupFilter: {hideUsers: true},
							name: undefined,
							label: t("Visible to"),
							value: Object.keys(entities.get("Group")!.defaultAcl!),
							hint: t("New users will be visible to these groups")
						}),
					),

				)
			),

			tbar({},
				"->",
				btn({
					type: "submit",
					text: t("Save"),
					cls: "primary"
				})
				)

		);
	}
}