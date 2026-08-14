import {CustomFieldType} from "./CustomFieldType.js";
import {
	browser,
	btn,
	comp,
	Component,
	containerfield,
	h4,
	MapField,
	mapfield,
	Notifier,
	t,
	textfield
} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldAttachmentsDialog} from "./CustomFieldAttachmentsDialog.js";
import {CustomField, customFields} from "../CustomFields.js";
import {client} from "../../jmap/index.js";

export class CustomFieldAttachments extends CustomFieldType {
	constructor() {
		super(
			"Attachments",
			"attachment",
			t("Attachments")
		)
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldAttachmentsDialog();
	}

	createDetailField(field: CustomField) {
		const config = this.getDetailFieldConfig(field);
		return comp({},

				h4(config.label),

				mapfield({...config,

				listeners: {
					setvalue: ({target, newValue}) => {
						target.hidden = !newValue || Object.keys(newValue).length == 0;
					}
				},

				buildField: (v: any) => {

					return containerfield({flex:'1 0 100%',cls: 'flow'},
						btn({
							icon: "description",
							text: v.name,
							flex:'1',
							style:{textAlign:'left'},
							handler() {
								client.downloadBlobId(v.blobId, v.title).catch((error) => {
									Notifier.error(error);
								})
							}
						})
					);
				}

			})
		);
	}

	createFormField(field: CustomField) {
		const config = this.getFormFieldConfig(field);
		const attsFld  = mapfield({...config,

			buildField: (v: any) => {

				return containerfield({flex:'1 0 100%',cls: 'flow'},
					textfield({hidden:true,name:'name'}),
					textfield({hidden:true,name:'blobId'}),
					btn({
						icon: "description",
						text: v.name,
						flex:'1',
						style:{textAlign:'left'},
						handler() {
							client.downloadBlobId(v.blobId, v.title).catch((error) => {
								Notifier.error(error);
							})
						}
					}),

					btn({icon: "delete", width:50, handler(btn) {btn.parent!.remove();}})
				);
			}
		});

		return comp({},
			h4(config.label),
			attsFld,
			btn({
				icon:'attach_file',
				text: t("Attach file"),
				handler: _ => this.attachFile(attsFld) }
			)
		)
	}

	private attachFile(attsFld: MapField) {
		browser.pickLocalFiles(true).then(files => {
			attsFld.mask();
			client.uploadMultiple(files).then(blobs => {
				for(const r of blobs)
					attsFld.add({blobId:r.id, name: r.name}, );
			}).finally(() => {
				attsFld.unmask();
			});
		});
	}
}

customFields.registerType(new CustomFieldAttachments);