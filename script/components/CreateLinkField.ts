import {
	AutocompleteChips,
	column, Config, createComponent, DataSourceForm,
	DataSourceStore,
	datasourcestore, FieldEventMap, Format, t,
	Table,
	table
} from "@intermesh/goui";
import {jmapds} from "../jmap/index";
import {entities} from "../Entities";
import {Link} from "../model/Link";

export class CreateLinkField extends AutocompleteChips<Table<DataSourceStore>> {

	constructor() {
		super(table({
			fitParent: true,
			headers: false,
			store: datasourcestore({
				dataSource: jmapds("Search"),
				sort: [{isAscending:false, property:"modifiedAt"}],
				queryParams: {
					limit: 20
				}
			}),

			columns: [
				column({
					header: "Name",
					id: "name",
					sortable: true,
					resizable: true,
					renderer: (columnValue, record) => {
						return `<h3>${record.name.htmlEncode()}</h3><h4>${record.description.htmlEncode()}</h4><h5>${Format.smartDateTime(record.modifiedAt)}</h5>`
					}
				}),

				column({
					id: "entity",
					sortable: false,
					width: 80,
					renderer: (columnValue, record, td, table1, storeIndex, column1) => {

						const cfg = entities.getLinkConfig(columnValue, record.filter);
						return `<div title="${cfg?.title.htmlEncode()}" class="icon ${cfg?.iconCls}"</div>`;
					}
				})
			]
		}));

		this.label = t("Create links")

		this.chipRenderer =  async (chip, value) => {
			chip.text = (await this.list.store.dataSource.single(value.searchId) as any).name;
		}

		this.pickerRecordToValue = (field, record) => {
			return {searchId: record.id, entityId: record.entityId, entityType: record.entity};
		}

		this.on("autocomplete" , (field, input) => {
			this.list.store.setFilter("autocomplete", {text: input});
			void this.list.store.load();
		})

		this.on("render", () => {
			const f = this.findAncestorByType(DataSourceForm);
			if(!f) {
				return;
			}
			f.on("save", () => {

				this.value.forEach((v:any) => {
					void jmapds<Link>("Link").create({
						fromId: f.currentId,
						fromEntity: f.dataSource.id,
						toId: v.entityId,
						toEntity: v.entityType
					})
				});

			}, {unshift: true});
		})
	}
}

export const createlinkfield = (config?: Config<CreateLinkField, FieldEventMap<CreateLinkField>>) => createComponent(new CreateLinkField(), config);