import {
	browser,
	btn, Button,
	comp,
	createComponent,
	Field, FieldConfig, FieldValue,
	Format,
	t,
} from "@intermesh/goui";
import {client, UploadResponse} from "../../jmap";

type FileButtonFieldConfig<Type extends FieldValue = Record<string, any>> = FieldConfig<FileButtonField<Type>, "accept">

export class FileButtonField<Type extends FieldValue = Record<string, any>> extends Field {
	private downloadBtn: Button;

	private blob: UploadResponse | undefined;

	constructor(public accept: string) {
		super();

		this.items.add(
			comp({cls: "hbox", flex: 1},
				this.downloadBtn = btn({
				}),
				btn({
					width: 50,
					icon: "browse",
					title: t("Browse"),
					handler: async () => {
						const files = await browser.pickLocalFiles(false, false, this.accept)
						this.mask();
						try {
							const blobs = await client.uploadMultiple(files);
							this.value = blobs[0];
							this.blob = blobs[0];
						} finally {
							this.unmask();
						}
					}
				}),
				btn({
					width: 50,
					icon: "clear",
					title: t("Clear"),
					handler: button => {
						this.blob = undefined;
						this.value = "";
					}
				})
			)
		)
	}

	setValue(value: UploadResponse | undefined) {
		if (value) {
			this.blob = value;
		}
		this.afterSetValue();
	}

	protected async internalSetValue(v: any | undefined) {
		this.afterSetValue();
	}

	private afterSetValue(): void {
		if (this.blob) {
			this.downloadBtn.disabled = false;
			this.downloadBtn.text = `${this.blob.name} (${Format.fileSize(this.blob.size)})`;
			this.downloadBtn.handler = async () => {
				await client.downloadBlobId(this.blob!.id, this.blob!.name);
			}
		} else {
			this.downloadBtn.disabled = true;
			this.downloadBtn.text = "";
		}
		this.el.classList.toggle("has-value", true);
	}
}

export const filebutton = <Type extends FieldValue = Record<string, any>>(config?: FileButtonFieldConfig<Type>) => createComponent(new FileButtonField<Type>(config!.accept), config);