import {
	ArrayField,
	arrayfield,
	btn,
	comp,
	containerfield,
	fieldset,
	Fieldset,
	Filter,
	Form,
	form,
	radio,
	select,
	t,
	tbar
} from "@intermesh/goui";
import {entities, Entity} from "../../Entities.js";
import {StringFilter} from "./stricttypes/StringFilter.js";
import {NumberFilter} from "./stricttypes/NumberFilter.js";
import {DateFilter} from "./stricttypes/DateFilter.js";
import {SelectFilter} from "./stricttypes/SelectFilter.js";
import {SubConditionDialog} from "./SubConditionDialog.js";
import {SubConditionFilter} from "./stricttypes/SubConditionFilter.js";
import {StrictFilterType} from "./stricttypes/StrictFilterType.js";

export class FilterFieldset extends Fieldset {
	private entity: Entity;
	private conditionsArrayField: ArrayField;
	public form: Form;

	constructor(entityName: string) {
		super();

		this.flex = 1;

		this.entity = entities.get(entityName);

		this.items.add(
			this.form = form({},
				radio({
					name: "operator",
					type: "button",
					label: t("How many condition should match?"),
					value: "AND",
					options: [
						{
							text: t("All"),
							value: "AND"
						}, {
							text: t("At least one"),
							value: "OR"
						}, {
							text: t("None"),
							value: "NOT"
						}
					]
				}),
				this.conditionsArrayField = arrayfield({
					name: "conditions",

					buildField: (value) => {
						const container = containerfield({
							cls: "hbox ",
							style: {
								maxWidth: "100%"
							}
						});

						const filters = this.entity.filters;

						filters.subconditions = {
							type: "subconditions",
							name: "subconditions",
							title: t("Sub conditions")
						};

						const filterSelect = select({
							width: 300,
							valueField: "name",
							textRenderer: (f: any) => f.title,
							listeners: {
								setvalue: ({newValue, oldValue}) => {
									if (newValue && newValue !== oldValue) {
										const filter = filters[newValue];

										filterField.items.clear();

										if (filter) {
											const fieldsetForType = this.getFilterFieldset(filter);

											if (fieldsetForType) {
												filterField.items.add(fieldsetForType);
											} else {
												if (!filter.typeConfig) {
													filter.typeConfig = {};
												}

												Ext.apply(filter.typeConfig, {
													columnWidth: 1,
													filter: filter,
													customfield: filter.customfield
												});

												const cls = eval(filter.type);

												filterField.items.add(fieldset({},
													new cls(filter.typeConfig)
												));
											}
										}
									}
								}
							},
							options: Object.values(filters)
						});

						const filterField = comp();

						const delBtn = btn({
							icon: "delete",
							style: {
								position: "absolute",
								right: "0",
								zIndex: "2"
							},
							cls: "bg-mid",
							title: t("Delete"),
							handler: () => {
								container.remove();
							}
						});

						if (Object.keys(value).length === 1) {
							const filterName = Object.keys(value)[0];

							const filterValue = Object.values(value)[0];
							if (filterName) {
								filterSelect.value = Object.keys(value)[0];

								(filterField.items.first() as StrictFilterType).load(filterValue);
							}
						} else if (Object.keys(value).length > 1) {
							filterSelect.value = "subconditions";

							(filterField.items.first() as SubConditionFilter).load(value);
						}

						container.items.add(filterSelect, filterField, delBtn);

						return container;
					}
				})
			),
			tbar({},
				btn({
					text: t("Add condition"),
					handler: () => {
						this.conditionsArrayField.addValue({});
					}
				}),
				'->',
				btn({
					text: t("Add sub group"),
					handler: () => {
						const dlg = new SubConditionDialog(entityName);

						dlg.filterFieldset.form.on("submit", ({target}) => {
							if (target.value.conditions.length == 0) {
								return
							}

							const conditionsObj = {};

							target.value.conditions.forEach((condition: any) => {
								Object.assign(conditionsObj, condition);
							});

							const newValue = {
								"subconditions": {
									operator: target.value.operator,
									conditions: conditionsObj
								}
							};

							this.conditionsArrayField.addValue(newValue);
						});

						dlg.show();
					}
				})
			)
		)
	}

	private getFilterFieldset(filter: Filter): Fieldset | undefined {
		let fieldset;

		switch (filter.type) {
			case "string":
				fieldset = new StringFilter(filter);
				break;
			case "number":
				fieldset = new NumberFilter(filter);
				break;
			case "date":
				fieldset = new DateFilter(filter);
				break;
			case "select":
				fieldset = new SelectFilter(filter);
				break;
			case "subconditions":
				fieldset = new SubConditionFilter(filter, this.entity.name);
				break;
		}

		return fieldset;
	}
}