import {
	btn,
	checkbox,
	column,
	comp,
	Component,
	datasourcestore,
	Format,
	t,
	table,
	tbar,
	TextField,
	textfield
} from "@intermesh/goui";
import {entityttypeable} from "../EntityTypeTable";
import {searchDS} from "../../model/Link";
import {entities} from "../../Entities";

export class SelectSearchPanel extends Component {

	public readonly entityTypeTable
	public readonly resultTable
	private searchField: TextField;

	constructor() {
		super();

		this.cls = "hbox";
		this.flex = 1;

		this.resultTable = this.createTable();

		this.items.add(
			comp({cls: "vbox border-right"},
				tbar({cls: "border-bottom"},
					checkbox({
						label: t("Select all")
					}).on("change", ({newValue}) => {
						newValue ? this.entityTypeTable.rowSelection!.selectAll() : this.entityTypeTable.rowSelection!.clear()
					})
				),
				comp({width: 180, cls: "fit scroll", flex: 1},
					this.entityTypeTable = entityttypeable({
						rowSelectionConfig: {
							clickToAdd: true,
							multiSelect: true,
							listeners: {
								selectionchange: ({selected}) => {
									this.resultTable.store.setFilter("entityType", {entities: selected.map((r) => {
											return {name: r.record.entity,filter: r.record.filter};
										})})

									this.resultTable.store.load();
								}
							}
						}
					})
				)
			),

			comp({flex: 1, cls: "vbox"},
				tbar({cls: "border-bottom"},
					this.searchField = textfield({
						flex: 1,
						icon: "search",
						buttons: [
							btn({
								icon: "clear",
								handler: btn => {
									const tf = btn.findAncestorByType(TextField)!
									tf.reset()
									tf.focus();
								}
							})]
					})
						.on("input", ({value}) => {
							this.resultTable.store.setFilter("search", {text: value});
							void this.resultTable.store.load();
						}, {buffer: 300})
						.on("focus", ({target}) => {target.select()})
						.on("render", ({target}) => {
							target.el.addEventListener("keydown", (ev) => {
								if(ev.key == "ArrowDown") {
									this.resultTable.focus();
								}

							})
						})

					),
				comp({
						flex: 1,
						cls: "scroll bg-lowest"
					},
					this.resultTable
				)
			)
		);

		this.on("focus", () => this.searchField.focus());

	}

	private createTable() {
		return table({
			scrollLoad: true,
			headers: false,
			style: {width: "100%"},
			rowSelectionConfig: {multiSelect: true},
			store: datasourcestore({
				dataSource: searchDS,
				sort: [{isAscending:false, property:"modifiedAt"}],
				queryParams: {
					limit: 20
				}
			}),

			columns: [

				column({
					id: "entity",
					sortable: false,
					width: 48,
					htmlEncode: false,
					renderer: (columnValue, record, td, table1, storeIndex, column1) => {

						const cfg = entities.getLinkConfig(columnValue, record.filter);
						return `<div title="${cfg?.title.htmlEncode()}" class="icon ${cfg?.iconCls}"</div>`;
					}
				})
				,
				column({
					header: "Name",
					id: "name",
					sortable: true,
					resizable: true,
					htmlEncode: false,
					renderer: (columnValue, record) => {
						return `<h3>${record.name.htmlEncode()}</h3><h4>${record.description.htmlEncode()}</h4><h5>${Format.smartDateTime(record.modifiedAt)}</h5>`
					}
				})


			]
		})
	}
}