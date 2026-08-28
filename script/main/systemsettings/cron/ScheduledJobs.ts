import {
	btn,
	column,
	comp,
	datasourcestore,
	datecolumn, menu, menucolumn,
	t,
	table,
	Table
} from "@intermesh/goui";
import {systemSettingsPanels} from "../SystemSettingsWindow";
import {AbstractModuleSystemSettingsPanel} from "../AbstractModuleSystemSettingsPanel";
import {JmapDataSource, jmapds} from "../../../jmap";
import {ScheduledJobDialog} from "./ScheduledJobDialog";

export const cronjobScheduleDS = new JmapDataSource("CronJobSchedule");

class ScheduledJobs extends AbstractModuleSystemSettingsPanel {
	private readonly tbl: Table;

	constructor() {
		super("scheduledjobs", t("Manage system tasks"), "core", "core", "schedule");

		this.cls = "vbox fit";

		const cronStore = datasourcestore({
			dataSource: cronjobScheduleDS,
			sort: [{property: "moduleId", isAscending: true}, {property: "description", isAscending: true}]
		});

		this.tbl = table({
			fitParent: true,
			store: cronStore,
			columns: [
				column({
					header: t("Enabled"),
					id: "enabled",
					width: 90,
					renderer: (v) => btn({
						icon: v ? "check_circle" : "cancel",
						cls: v ? "primary" : "accent",
						title: v ? t("Yes") : t("No")
					})
				}),
				column({
					header: t("System task scheduler"),
					id: "description"
				}),
				column({
					header: t("Name"),
					id: "name",
					hidden: true
				}),
				column({
					header: t("Expression"),
					id: "expression",
					width: 150
				}),
				datecolumn({
					header: t("Next run"),
					id: "nextRunAt"
				}),
				datecolumn({
					header: t("Last run"),
					id: "lastRunAt"
				}),
				datecolumn({
					header: t("Running since"),
					id: "completedAt"
				}),
				column({
					header: t("Error"),
					id: "runningSince"
				}),
				column({
					header: t("Module"),
					id: "moduleId",
					renderer: async (v) => {
						const mod = await jmapds("Module").single(v);
						return `${mod.package || "legacy"} - ${mod.name}`;
					}
				}),
				column({
					header: t("Job"),
					hidden: true,
					id: "jobName"
				}),
				menucolumn({
					menu: menu({},
						btn({
							icon: "edit",
							text: t("Edit"),
							handler: (b) => {
								const rowIndex = b.parent!.dataSet.rowIndex,
									record = cronStore.get(rowIndex)!;
								this.edit(record.id);
							}
						})
					)
				})
			],
			scrollLoad: true,
			listeners: {
				rowdblclick: async ({storeIndex}) => {
					// this.edit(cronStore.get(storeIndex)!.id);
				},
				render: () => {
					void cronStore.load();
				}
			},

		});

		this.items.add(
			comp({
					flex: 1,
					cls: "scroll bg-lowest"
				},
				this.tbl
			)
		);

		void this.load();
	}

	public async edit(id: string) {
		const dlg = new ScheduledJobDialog();
		dlg.show();
		if (id) {
			void dlg.load(id);
		}
		return dlg;

	}
}

systemSettingsPanels.add(ScheduledJobs);