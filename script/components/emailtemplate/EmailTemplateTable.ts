import {btn, column, DataSourceStore, datasourcestore, menu, t, Table} from "@intermesh/goui";
import {EmailTemplate, emailTemplateDS} from "./index";
import {JmapDataSource} from "../../jmap";
import {EmailTemplateDialog} from "./EmailTemplateDialog";

export class EmailTemplateTable extends Table<DataSourceStore<JmapDataSource<EmailTemplate>>> {
	constructor() {
		const store = datasourcestore({
			dataSource: emailTemplateDS,
			queryParams: {
				limit: 20
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
									const dlg = new EmailTemplateDialog();
									dlg.load(id).then(() => dlg.show());
								}
							}),
							btn({
								text: t("Copy"),
								icon: "file_copy",
								handler: () => {
									const newRecord = structuredClone(record);
									delete newRecord.id;
									newRecord.attachments.map((b: any) => delete b.id);
									const dlg = new EmailTemplateDialog();
									dlg.form.value = newRecord;
									dlg.show();
								}
							}),
							btn({
								text: t("Delete"),
								icon: "delete",
								handler: () => {
									void emailTemplateDS.confirmDestroy([id]);
								}
							})
						)
					})
				}
			})
		];
		super(store, columns);
		this.fitParent = true;
	}
}