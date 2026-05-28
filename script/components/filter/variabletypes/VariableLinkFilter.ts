import {VariableFilterType} from "./VariableFilterType.js";
import {autocompletechips, column, Filter, store, t, table} from "@intermesh/goui";
import {entities} from "../../../Entities.js";

export class VariableLinkFilter extends VariableFilterType {
	constructor(filter: Filter) {
		super(filter);

		const options = entities.getLinkConfigs().map(lc => {
			const id = lc.filter ? `${lc.entity}-${lc.filter}` : lc.entity;
			return {
				id: id,
				entity: lc.entity,
				name: lc.title,
				filter: lc.filter ?? null,
				iconCls: lc.iconCls
			};
		});


		this.items.add(
			autocompletechips({
				label: t(filter.title),
				list: table({
					fitParent: true,
					headers: false,
					store: store({data: options}),
					columns: [
						column({
							id: "name"
						})
					]
				}),
				pickerRecordToValue: (_field, record) => record.id,
				chipRenderer: async (chip, value) => {
					const option = options.find(o => o.id === value);
					chip.text = option?.name ?? value;
				},
				listeners: {
					setvalue: ({newValue}) => {
						this.valueField.value = newValue;
					}
				}
			})
		);
	}
}