/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2026 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */

import {createComponent, Field, FieldConfig, Notifier, t} from "@intermesh/goui";
import EasyMDE from "easymde";
import {client} from "../../jmap/Client.js";
import {Markdown} from "../../util/Markdown.js";

/**
 * Markdown editor field using EasyMDE
 *
 * Dropped and pasted images are uploaded and inserted as a blob download URL. The server parses these to attach the
 * blobs to the entity.
 *
 * @link https://github.com/Ionaru/easy-markdown-editor
 */
export class MarkdownField extends Field {

	protected baseCls = "goui-form-field goui-markdown-field";

	private editor?: EasyMDE;

	protected createControl() {
		const textarea = document.createElement("textarea");
		textarea.value = (this._value as string) ?? "";
		return textarea;
	}

	protected internalRender(): HTMLElement {
		const el = super.internalRender();

		this.editor = new EasyMDE({
			element: this.control,
			initialValue: (this._value as string) ?? "",
			autoDownloadFontAwesome: false,
			spellChecker: false,
			nativeSpellcheck: true,
			autoRefresh: {delay: 300},
			status: ["upload-image"],
			minHeight: "100px",
			uploadImage: true,
			imagePathAbsolute: true,
			imageUploadFunction: (file, onSuccess, onError) => {
				client.upload(file).then(r => {
					// Don't call onSuccess(). EasyMDE checks the URL for an image file extension and inserts a link
					// instead of an image because the blob download URL has none.
					this.insertImage(file.name, client.downloadUrl(r.id));
				}).catch(err => {
					console.error(err);
					Notifier.error(t("Failed to upload {name}").replace("{name}", file.name));
					onError(t("Failed to upload {name}").replace("{name}", file.name));
				});
			},
			previewRender: (text) => Markdown.toHtml(text),
			previewClass: ["editor-preview", "normalize"],
			toolbar: [
				this.toolbarBtn("bold", EasyMDE.toggleBold, "format_bold", t("Bold")),
				this.toolbarBtn("italic", EasyMDE.toggleItalic, "format_italic", t("Italic")),
				this.toolbarBtn("strikethrough", EasyMDE.toggleStrikethrough, "format_strikethrough", t("Strikethrough")),
				this.toolbarBtn("heading", EasyMDE.toggleHeadingSmaller, "title", t("Heading")),
				"|",
				this.toolbarBtn("quote", EasyMDE.toggleBlockquote, "format_quote", t("Quote")),
				this.toolbarBtn("unordered-list", EasyMDE.toggleUnorderedList, "format_list_bulleted", t("Bullet list")),
				this.toolbarBtn("ordered-list", EasyMDE.toggleOrderedList, "format_list_numbered", t("Numbered list")),
				this.toolbarBtn("checklist", EasyMDE.toggleCheckList, "checklist", t("Checklist")),
				"|",
				this.toolbarBtn("code", EasyMDE.toggleCodeBlock, "code", t("Code")),
				this.toolbarBtn("link", EasyMDE.drawLink, "link", t("Link")),
				this.toolbarBtn("upload-image", EasyMDE.drawUploadedImage, "image", t("Image")),
				this.toolbarBtn("table", EasyMDE.drawTable, "table", t("Table")),
				"|",
				Object.assign(this.toolbarBtn("preview", EasyMDE.togglePreview, "visibility", t("Preview")), {noDisable: true})
			]
		});

		return el;
	}

	/**
	 * Insert a markdown image at the cursor
	 *
	 * @param name Used as alt text
	 * @param url
	 */
	public insertImage(name: string, url: string) {
		if (!this.editor) {
			return;
		}
		const alt = name.replace(/[\[\]\\]/g, "");
		this.editor.codemirror.replaceSelection(`![${alt}](${url})`);
		this.editor.updateStatusBar("upload-image", "");
		this.editor.codemirror.focus();
	}

	private toolbarBtn(name: string, action: (editor: EasyMDE) => void, icon: string, title: string): EasyMDE.ToolbarIcon {
		return {
			name,
			action,
			className: "md-" + name,
			icon: `<i class="icon">${icon}</i>`,
			title
		};
	}

	protected internalSetValue(v?: any) {
		if (this.editor) {
			this.editor.value(v ?? "");
		} else if (this.control) {
			(this.control as HTMLTextAreaElement).value = v ?? "";
		}
	}

	protected internalGetValue() {
		return this.editor ? this.editor.value() : this._value;
	}

	public set readOnly(readOnly: boolean) {
		super.readOnly = readOnly;
		this.editor?.codemirror.setOption("readOnly", readOnly);
	}

	public get readOnly() {
		return super.readOnly;
	}

	public focus(o?: FocusOptions) {
		if (this.editor) {
			this.editor.codemirror.focus();
		} else {
			super.focus(o);
		}
	}

	protected internalRemove() {
		if (this.editor) {
			this.editor.cleanup();
			this.editor.toTextArea();
			this.editor = undefined;
		}
		super.internalRemove();
	}
}

/**
 * Shorthand function to create {@link MarkdownField}
 *
 * @param config
 */
export const markdownfield = (config?: FieldConfig<MarkdownField>) => createComponent(new MarkdownField(), config);
