import {
	AutocompleteChips,
	column,
	comp,
	Config,
	createComponent,
	DataSourceForm,
	DataSourceStore,
	datasourcestore,
	Format,
	menu,
	t,
	Table,
	table
} from "@intermesh/goui";
import {jmapds} from "../jmap/index";
import {entities} from "../Entities";
import {Link} from "../model/Link";
import {entityttypeable} from "./EntityTypeTable";


export class CreateLinkField extends AutocompleteChips<Table<DataSourceStore>> {

	constructor() {
		super(table({
			width: 400,
			headers: false,
			rowSelectionConfig: {multiSelect: false},
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
					htmlEncode: false,
					renderer: (columnValue, record) => {
						return `<h3>${record.name.htmlEncode()}</h3><h4>${record.description.htmlEncode()}</h4><h5>${Format.smartDateTime(record.modifiedAt)}</h5>`
					}
				}),

				column({
					id: "entity",
					sortable: false,
					width: 80,
					htmlEncode: false,
					renderer: (columnValue, record, td, table1, storeIndex, column1) => {

						const cfg = entities.getLinkConfig(columnValue, record.filter);
						return `<div title="${cfg?.title.htmlEncode()}" class="icon ${cfg?.iconCls}"</div>`;
					}
				})
			]
		}));




		this.label = t("Create links")

		this.chipRenderer =  async (chip, value) => {
			let search:any;
			if(value.searchId) {
				search = await this.list.store.dataSource.single(value.searchId);
			} else {

				value.searchId = (await this.list.store.dataSource.query({
					filter: {
						entities: [{name: value.entityName}],
						entityId: value.entityId
					}
				})).ids[0]
				search = await this.list.store.dataSource.single(value.searchId);
			}
			chip.text = search.name;
		}

		this.pickerRecordToValue = (field, record) => {
			return {searchId: record.id, entityId: record.entityId, entityName: record.entity};
		}

		this.on("autocomplete" , ({input}) => {
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
						toEntity: v.entityName
					})
				});

			}, {unshift: true});
		})
	}
	protected createMenu() {

		return menu({
				cls: "goui-dropdown hbox",
				style: {padding: "0"},
				removeOnClose: false,
				height: 400
			},

			comp({
					cls: "hbox fit",
				},
				comp({width: 180, cls: "fit scroll border-right"},
					entityttypeable({
						rowSelectionConfig: {
							multiSelect: true,
							listeners: {
								selectionchange: ({selected}) => {
									this.list.store.setFilter("entityType", {entities: selected.map((r) => {
											return {name: r.record.entity,filter: r.record.filter};
										})})

									this.list.store.load();
								}
							}
						}
					})
				),
				comp({
						cls: "fit scroll",
						flex: 1
					},
					this.list
				)
			)
		);
	}
}

export const createlinkfield = (config?: Config<CreateLinkField>) => createComponent(new CreateLinkField(), config);