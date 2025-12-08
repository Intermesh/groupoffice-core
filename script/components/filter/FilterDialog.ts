import {FormWindow} from "../FormWindow.js";
import {fieldset, t, textfield} from "@intermesh/goui";
import {FilterFieldset} from "./FilterFieldset.js";

export class FilterDialog extends FormWindow {
	constructor(entityName: string) {
		super("EntityFilter");

		this.title = t("Filter");
		this.height = 600;
		this.width = 1050;
		this.maximizable = true;
		this.modal = true;

		const filterFieldset = new FilterFieldset(entityName);
		filterFieldset.form.name = "filter";

		this.addSharePanel();

		this.generalTab.items.add(
			fieldset({},
				textfield({
					flex: 1,
					name: "name",
					label: t("Name"),
					required: true
				})
			),
			filterFieldset
		);

		this.form.on("beforesave", ({data}) => {
			data.entity = entityName;

			const transformConditions = (conditions: any[]): any[] => {
				return conditions.map(condition => {
					if (condition.subconditions) {
						const subcond = condition.subconditions;
						const {subconditions, ...otherFilters} = condition;

						const result: any[] = [];

						Object.keys(otherFilters).forEach(key => {
							result.push({[key]: otherFilters[key]});
						});

						result.push({
							operator: subcond.operator,
							conditions: transformConditions(
								Array.isArray(subcond.conditions)
									? subcond.conditions
									: Object.entries(subcond.conditions).map(([k, v]) => ({[k]: v}))
							)
						});

						return result.length === 1 ? result[0] : {
							operator: subcond.operator,
							conditions: result
						};
					}

					return condition;
				});
			};

			if (data.filter && data.filter.conditions) {
				data.filter.conditions = transformConditions(data.filter.conditions);
			}
		});
	}
}