import {
	arrayfield,
	ArrayField, browser, btn, checkbox,
	comp,
	Component,
	Config, ContainerField,
	containerfield,
	createComponent,
	displayfield, menu, t, tbar, textfield
} from "@intermesh/goui";
import {client} from "../../jmap";
import {MimeType} from "../../util/MimeType";

export class AttachmentsField extends Component {
	private attachments: ArrayField;

	constructor() {
		super();
		this.flex = 1;
		this.cls = "hbox";
		this.items.add(
			comp({
					flex: 1
				},
				this.attachments = arrayfield({
					itemContainerCls: "",
					name: "attachments",
					buildField: (v) => {
						const iconCls = MimeType.icon(v.name);
						return containerfield({
								cls: "hbox"
							},
							btn({
								text: `${v.name.htmlEncode()}`,
								icon: iconCls,
								menu: menu({},
									btn({
										icon: "download",
										text: t("Download"),
										handler: async () => {
											await client.downloadBlobId(v.blobId, v.name)
										}
									}),
									btn({
										icon: "delete",
										text: t("Delete"),
										handler: (button) => {
											button.findAncestorByType(ContainerField)!.remove()
										}
									})
								)
							}),
							textfield({
								name: "blobId",
								hidden: true,
								readOnly: true
							}),
							checkbox({
								label: t("Inline"),
								type: "box",
								readOnly: true,
								hidden: true,
								name: "inline"
							}),
							checkbox({
								label: t("Attachment"),
								type: "box",
								readOnly: true,
								hidden: true,
								name: "attachment"
							}),
						)
					}
				})),
			comp({
					width: 60
				},
				btn({
						cls: "primary",
						icon: "attach_file",
						title: t("Attach file"),
						menu: menu({},
							btn({
								text: t("Upload"),
								icon: "upload",
								handler: async () => {
									const files = await browser.pickLocalFiles(true);
									this.mask();
									const blobs = await client.uploadMultiple((files));
									this.unmask();

									const attachments = this.attachments.value;
									blobs.forEach((blob: any) => {
										attachments.push({
											name: blob.name,
											blobId: blob.id,
											inline: false,
											attachment: true,
										})
									})
									this.attachments.value = attachments;
								}
							}),
							btn({
								icon: "folder",
								text: t("Add from Group-Office"),
								handler: () => {
									// ...
								}
							})
						)
					}
				)
			)
		)
	}
}

export const attachmentsfield = (config?: Config<AttachmentsField>) => createComponent(new AttachmentsField(), config);