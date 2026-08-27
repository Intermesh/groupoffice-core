import {
	ArrayUtil,
	autocompletechips,
	btn,
	checkbox,
	checkboxselectcolumn,
	column,
	containerfield,
	datasourceform,
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



export class UserDefaultsWindow extends Window {
	private form;
	constructor() {
		super();

		this.title = t("User defaults");
		this.modal = true;

		this.width = 800;
		this.width = 700;

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

		const panels = ArrayUtil.multiSort(main.getPanels(), [{property:"title"}])


		return datasourceform({
				dataSource: moduleDS,
				patchMode: true,
				cls: "fit vbox"
		},

			containerfield({
					keepUnknownValues: false,
					name: "settings",
					cls: "autofit scroll",
					flex: 1
			},

				fieldset({legend: t("Regional"), flex: 1},
					timezonefield({name: "defaultTimezone"}),
					dateformatfield({name: "defaultDateFormat"}),
					timeformatfield({name: "defaultTimeFormat"}),
					checkbox({name: 'defaultShortDateInList',label: t("Use short format for date and time in lists")}),
					firstweekdayfield({name: "defaultFirstWeekday"})
				),

				fieldset({legend: t('Formatting'), width: 200},
					textfield({name:'defaultListSeparator', label: t('List separator')}),
					textfield({name:'defaultTextSeparator', label: t('Text separator')}),
					textfield({name:'defaultThousandSeparator', label: t('Thousand separator')}),
					textfield({name:'defaultDecimalSeparator', label: t('Decimal separator')}),
					textfield({name:'defaultCurrency', label: t('Currency')}),
				),


				fieldset({legend: t("Other"), flex: 1},

					checkbox({
						name: 'defaultConfirmOnMove',
						label: t("Show confirmation dialog on move"),
						hint: t("When this is on and items are moved by dragging, confirmation is requested")
					}),

					autocompletechips({
						name: "defaultPinnedTabs",
						label: t("Pinned tabs"),
						list: table({
							fitParent: true,
							headers: false,
							store: store({
								data: panels
							}),
							rowSelectionConfig: {
								multiSelect: true
							},
							columns: [
								checkboxselectcolumn({
									id: "id"
								}),
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
									const filtered = panels.filter(r => r.title.startsWith(input));
									target.list.store.loadData(filtered, false);
								} else {
									target.list.store.loadData(panels, false);
								}
							}
						},
					}),

					groupchips({
						name: "defaultGroups",
						hint: t("Users will automatically be added to these groups", "users", "core"),
					})
				),



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