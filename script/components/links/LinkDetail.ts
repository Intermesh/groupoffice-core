import {
	btn,
	column,
	comp,
	Component,
	datasourcestore,
	DataSourceStore,
	DefaultEntity,
	Format,
	h3, menu,
	menucolumn, t,
	Table,
	table,
	TableColumn,
	tbar, Window
} from "@intermesh/goui";
import {entities, LinkConfig} from "../../Entities";
import {Link, linkDS, Search, searchDS} from "../../model/Link";
import {JmapDataSource} from "../../jmap/index";
import {DetailPanel} from "../DetailPanel";
import {LinkDetailWindow} from "./LinkDetailWindow";
import {ExtJSWrapper} from "../ExtJSWrapper";

class ExtJSWrapperLinkDetail extends ExtJSWrapper {

	constructor(comp:any) {
		super(comp);

		this.cls = "card link-detail";

		comp.on("hide", () => {
			this.hide();
		})
		comp.on("show", () => {
			this.show();
		})
	}
	onLoad(entity:any, detailPanel:DetailPanel) {
		this.extJSComp.onLoad({entity: detailPanel.entityName, currentId: entity.id});
	}
}
export class LinkDetail extends Component {
	private table: Table<DataSourceStore<JmapDataSource<Link>>>;

	constructor(public readonly link: LinkConfig) {
		super();

		this.cls = "card link-detail";

		this.items.add(
			tbar({},
				comp({tagName: "i", cls: link.iconCls}),
				h3(link.title)
			),

			this.table = this.createTable()
		)

		this.hidden = true;

		this.on("render", () => {

			this.table.store.on("datachanged", () => {
				this.hidden = this.table.store.count() == 0;
			})
		})

	}

	private createTable() {

		return table({
			headers: false,
			fitParent: true,
			store: datasourcestore({
				dataSource: linkDS,
				relations: {
					to: {path: "toSearchId", dataSource: searchDS}
				},
				filters: {
					toEntity: {entities: [{name: this.link.entity, filter: this.link.filter}]}
				}
			}),
			columns: [
				column({
					id: "to",
					htmlEncode: false,
					renderer: (to: Search, record: Link & {to:Search}, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
						return `<h3 class="goui hbox"><span style="flex:1">${to.name.htmlEncode()}</span><small>${Format.smartDateTime(to.modifiedAt)}</small></h3><h4>${to.description.htmlEncode()}</h4>`;
					}
				}),

				menucolumn({
					menu: menu({},
						btn({
							text: t("Open"),
							icon: "open_in_new",
							handler: (b) => {
								this.open(b.parent!.dataSet.rowIndex);
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
			],
			listeners: {
				rowclick: ({storeIndex}) => {
					this.open(storeIndex);
				}
			}
		})
	}

	private open(storeIndex:number) {
		const rec = this.table.store.get(storeIndex);
		if(!rec) {
			throw "Invalid index";
		}

		const win = new LinkDetailWindow(rec.toEntity);
		win.show();
		void win.load(rec.toId);
		return win;

	}

	public async onLoad(entity:DefaultEntity, detail: DetailPanel) {
		this.hide();
		this.table.store.setFilter("fromEntity", {entity: detail.entityName, entityId: entity.id})

		await this.table.store.load();
	}


	public static getAll(){

		const panels:(LinkDetail|Component)[] = [];

		entities.getLinkConfigs().forEach(link => {
			if(link.linkDetailCards) {

				link.linkDetailCards().forEach((c:any) => {
					panels.push(new ExtJSWrapperLinkDetail(c))
				})

			} else {
				panels.push(new LinkDetail(link))
			}
		})

		return panels;
	}

}