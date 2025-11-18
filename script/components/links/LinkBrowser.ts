import {
	btn, cards,
	checkbox, column,
	comp, Component,
	datasourcestore, datecolumn,
	EntityID, Format, menu, menucolumn, root, searchbtn, splitter, store,
	t, Table,
	table, TableColumn,
	tbar,
	TextField,
	textfield,
	Window
} from "@intermesh/goui";
import {SelectSearchPanel} from "./SelectSearchPanel";
import {entityttypeable} from "../EntityTypeTable";
import {Link, linkDS, Search, searchDS} from "../../model/Link";
import {entities} from "../../Entities";
import {LinkDetailWindow} from "./LinkDetailWindow";
import {extjswrapper} from "../ExtJSWrapper";
import {LinkDetail} from "./LinkDetail";
import {DetailPanel} from "../DetailPanel";
import {addbutton} from "./AddButton";
import {SelectSearchWindow} from "./SelectSearchWindow";

export class LinkBrowser extends Window {
	private entityTypeTable;
	private table;
	private previewPanelContainer: Component;

	constructor(public readonly entityName: string, public readonly entityId: EntityID) {
		super();

		this.collapsible = true;
		this.maximizable = true;
		this.resizable = true;
		this.width = 1000;
		this.height = 600;

		this.title = t("Links")


		this.table = this.createTable();
		this.table.store.setFilter("from", {entity: entityName, entityId})
		this.on("render", () => {
			this.table.store.load();
		})

		this.items.add(
			comp({cls: "hbox", flex: 1},
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
										this.table.store.setFilter("entityType", {
											entities: selected.map((r) => {
												return {name: r.record.entity, filter: r.record.filter};
											})
										})

										this.table.store.load();
									}
								}
							}
						})
					)
				),

				comp({flex: 1, cls: "vbox"},
					tbar({},
						"->",
						searchbtn(),
						btn({
							icon: "add",
							cls: "filled primary",
							handler: () => {
								const win = new SelectSearchWindow();
								win.show();

								win.on("select", async ({records}) => {

									this.mask();

									try {
										await Promise.all(records.map(r => {
											return linkDS.create({
												fromEntity: this.entityName,
												fromId: this.entityId,
												//description
												toId: r.entityId,
												toEntity: r.entity
											})
										}));
									}catch(e) {
										await Window.error(e);
									}finally {
										this.unmask();
									}

								})
							}
						})
					),
					splitter({resizeComponent: s => s.nextSibling()!}),
					comp({
							flex: 1,
							cls: "scroll"
						},
						this.table
					)
				),

				splitter({resizeComponent: s => s.nextSibling()!}),

				this.previewPanelContainer = cards({
					width: 500,
					cls: "vbox"
				})
			)
		)
	}

	private createTable() {
		return table({
			cls: "bg-lowest",
			headers: false,
			style: {width: "100%"},
			rowSelectionConfig: {multiSelect: false},
			groupBy: "group",
			groupByCollapsible: false,
			groupByRenderer: (groupBy, record, list) => {
				console.log(record);
				const l = entities.getLinkConfig(record.toEntity, record.to.filter);
				if(l) {
					return `<i class="icon ${l.iconCls}"></i>&nbsp;${l.title.htmlEncode()}`;
				}

				return groupBy;
			},
			store: datasourcestore({
				dataSource: linkDS,
				sort: [{isAscending: true, property: "toEntity"}, {isAscending: true, property: "filter"}, {isAscending: false, property: "modifiedAt"}],
				queryParams: {
					limit: 20
				},
				buildRecord: (r:any) => {
					r.group = r.toEntity + "," + r.to.filter;
					return r;
				},
				relations: {
					to: {path: "toSearchId", dataSource: searchDS}
				},
			}),

			columns: [

				column({
					id: "to",
					htmlEncode: false,
					renderer: (to: Search, record: Link & {
						to: Search
					}, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
						return `<h3>${to.name.htmlEncode()}</h3>
							<h4>${to.description.htmlEncode()}</h4>`;
					}
				}),

				datecolumn({
					id: "modifiedAt",
					property: "to/modifiedAt"
				}),

				menucolumn({
					menu: menu({},
						btn({
							text: t("Open"),
							icon: "open_in_new",
							handler: (b) => {
								this.openLinkWindow(b.parent!.dataSet.rowIndex);
							}
						}),
						//
						// btn({
						// 	text: t("Edit description"),
						// 	icon: "edit",
						// }),

						"-",
						btn({
							text: t("Unlink"),
							icon: "delete",
							handler: async (b) => {
								const rec = this.table.store.get(b.parent!.dataSet.rowIndex);
								if (rec) {
									linkDS.confirmDestroy([rec.id]);
								}
							}
						})
					)
				})


			]
		}).on("rowclick", ({storeIndex}) => {

			const rec = this.table.store.get(storeIndex);
			if(!rec) {
				throw "Invalid index";
			}
			const pnl = this.getLinkPreview(rec.toEntity);
			void pnl.load(rec.toId);

			pnl.show();
			
		})
	}

	private openLinkWindow(storeIndex:number) {
		const rec = this.table.store.get(storeIndex);
		if(!rec) {
			throw "Invalid index";
		}

		const win = new LinkDetailWindow(rec.toEntity);
		win.show();
		void win.load(rec.toId);
		return win;

	}


	private getLinkPreview(entityName:string) : DetailPanel {

		let cmp = this.previewPanelContainer.findChild(entityName) as DetailPanel;
		if(cmp) {
			return cmp;
		}

		const entity = entities.get(entityName);

		this.title = entity.links[0].title;

		cmp = entity.links[0].linkDetail();
		cmp.flex = 1;

		if("getItemId" in cmp) {
			cmp = extjswrapper({comp: cmp, cls: "fit", flex: 1, proxies: ['load']}) as never as DetailPanel;
		}

		this.previewPanelContainer.items.add(cmp);

		return cmp;
	}
}