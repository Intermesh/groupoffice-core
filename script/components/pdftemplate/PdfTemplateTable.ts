import {column, datasourcestore, Store, Table, t, btn, menu, DataSourceStore} from "@intermesh/goui";
import {PdfTemplate, pdfTemplateDS} from "./index";
import {JmapDataSource} from "../../jmap";

export class PdfTemplateTable extends Table<DataSourceStore<JmapDataSource<PdfTemplate>>> {

	constructor(module: {name: string, package: string}) {

		const store = datasourcestore({
			dataSource: pdfTemplateDS,
			queryParams: {
				limit: 20
			},
			filters: {
				module: {module: module}
			},
			sort: [{property: "name", isAscending: true}]
		});

		const columns = [
			column({
				id: "id",
				hidden: true,
			}),
			column({
				id: "name",
				header: t("Name"),
				sortable: true,
			}),
			column({
				id: "language",
				header: t("Langugage"),
				width: 90,
				sortable: true,
			}),
			column({
				id: "key",
				header: "",
				sticky: true,
				width: 50,
				renderer: (v, record) => {
					const id = record.id;
					return btn({
						icon: "more_vert",
						menu: menu({},
							btn({
								text: t("Edit"),
								icon: "edit",
								handler: () => {
									const dlg = new go.pdftemplate.TemplateDialog(); // TODO: Refactor into GOUI
									dlg.load(id).show();
								}
							}),
							btn({
								text: t("Copy"),
								icon: "file_copy",
								handler: () => {
									debugger;
									const newRecord = structuredClone(record);
									delete newRecord.id;
									newRecord.blocks.map((b: any) => delete b.id);
									const dlg = new go.pdftemplate.TemplateDialog();
									dlg.setValues(newRecord);
									dlg.show();
								}
							}),
							btn({
								text: t("Delete"),
								icon: "delete",
								handler: () => {
									void pdfTemplateDS.confirmDestroy([id]);
								}
							})
						)
					})
				}
			})
		];
		super(store, columns);
		this.fitParent = true;

		this.on('rowdblclick', async ({storeIndex}) => {
			const dlg = new go.pdftemplate.TemplateDialog();
			dlg.load(this.store.get(storeIndex)!.id).show();
		});
	}
}