import {BaseEntity, btn, Button, Config, createComponent, menu, root, t, Window} from "@intermesh/goui";
import {DetailPanel} from "../DetailPanel.js";
import {entities, LinkConfig} from "../../Entities";
import {FormWindow} from "../FormWindow";
import {SelectSearchPanel} from "./SelectSearchPanel";
import {SelectSearchWindow} from "./SelectSearchWindow";
import {linkDS} from "../../model/Link";

export class AddButton extends Button {
	private entityName?: string;
	private entity?: BaseEntity;
	private detailPanel!: DetailPanel;
	constructor() {
		super();

		this.icon = "add_link";
		this.title = t("Add link");

		this.disabled = true;

		this.menu = this.buildMenu();

		this.on("render", () => {
			this.detailPanel = this.findAncestorByType(DetailPanel)!;

			this.detailPanel.on("load", ({entity}) => {
				this.setEntity(this.detailPanel.entityName, entity);

			})

			this.detailPanel.on("reset", () => {
				this.disabled = true;
			})

		})
	}

	setEntity(entityName:string, entity:BaseEntity) {
		this.entityName = entityName;
		this.entity = entity;
		this.disabled = false;
	}

	private buildMenu() {
		return menu({},
			btn({
				text: t("Existing item"),
				icon: "search",
				handler: () => {
					const win = new SelectSearchWindow();
					win.show();

					win.on("select", async ({records}) => {

						root.mask();

						try {
							await Promise.all(records.map(r => {
								return linkDS.create({
									fromEntity: this.entityName,
									fromId: this.entity!.id,
									//description
									toId: r.entityId,
									toEntity: r.entity
								})
							}));
						}catch(e) {
							await Window.error(e);
						}finally {
							root.unmask();
						}

					})
				}
			}),
			"-",
			...this.buildModuleMenuItem()
			)
	}

	private buildModuleMenuItem() {

		return (entities.getLinkConfigs().filter(l => !!l.linkWindow)).map(l => {
			 return btn({
				 text: l.title,
				 iconCls: l.iconCls,
				 handler: () => this.handleAddNew(l)
			 })
		})

	}

	private async handleAddNew(l:LinkConfig) {
		var window = await l.linkWindow!.call(this, this.entityName!, this.entity!.id, this.entity!, this.detailPanel);

		if (!window) {
			return;
		}

		if(!(window instanceof Ext.Window)) {
			return this.handleAddNewGOUI(l, window);
		} else {
			return this.handleAddNewExtJS(l, window);
		}
	}

	private findCreateLinkButton(window: any) {
		var tbars = [window.getFooterToolbar(), window.getBottomToolbar(), window.getTopToolbar()];
		for (var i = 0, l = tbars.length; i < l; i++) {
			if (!tbars[i]) {
				continue;
			}

			var btn = tbars[i].findByType("createlinkbutton");
			if (btn[0]) {
				return btn[0];
			}
		}
		return false;
	}

	private handleAddNewExtJS(l:LinkConfig, window:any) {
		//If go.form.Dialog turn off redirect to detail view.
		window.redirectOnSave = false;

		if (!window.isVisible() &&  !(GO.email && window instanceof GO.email.EmailComposer)) {
			window.show();
		}

		//Windows may implement setLinkEntity() so they can do stuff on linking.
		if (window.setLinkEntity) {
			//window.on('show', function () {
			window.setLinkEntity({
				entity: this.entityName,
				entityId: this.entity!.id,
				data: structuredClone(this.entity!) // to avoid that the detailview data is modified
			});
			//}, this, {single: true});
		}
		var win = window.win || window; //for some old dialogs that have a "win" prop (TaskDialog and EventDialog)
		var createLinkButton = this.findCreateLinkButton(win);

		if(createLinkButton) {
			//if window has a create link button then use this. Otherwise add a save listener.
			if(window.isVisible()) {
				createLinkButton.addLink(this.entityName, this.entity!.id);
			} else {
				//sometimes show is overriden and perhaps does an async load before showing. See FinanceDocumentDialog for example.
				window.on("show", () => {
					createLinkButton.addLink(this.entityName, this.entity!.id);
				}, this, {single: true});
			}
		} else {
			window.on('save', (window: any, entity: any) => {

				//hack for event dialog because save event is different
				if (l.entity === "Event") {
					entity = arguments[2].result.id;
				}

				var link = {
					fromEntity: this.entityName,
					fromId: this.entity!.id,
					toEntity: l.entity,
					toId: null
				};

				if (!Ext.isObject(entity)) {
					//old modules just pass ID
					link.toId = entity;
				} else {
					//in this case it's a go.form.Dialog
					link.toId = entity.id;
				}

				go.Db.store("Link").set({
					create: {clientId: link}
				}, function (options: any, success: boolean, result: any) {
					if (result.notCreated
						&& !(result.notCreated.clientId
							&& result.notCreated.clientId.validationErrors
							&& result.notCreated.clientId.validationErrors.toId
							&& result.notCreated.clientId.validationErrors.toId.code
							&& result.notCreated.clientId.validationErrors.toId.code === 11)) { //already exists
						Ext.MessageBox.alert(t("Error"), t("Could not create link"));
					}
				});

			}, this, {single: true});
		}
	}

	private handleAddNewGOUI(l: LinkConfig, w: FormWindow) {
		w.addLinkOnSave(this.entityName!, this.entity!.id);
		w.show();

		return w;

	}
}

export const addbutton = (config?: Config<AddButton>) => createComponent(new AddButton(), config);