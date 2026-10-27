/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2026 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */

import {marked} from "marked";
import DOMPurify from "dompurify";

/**
 * Content text type of entities like notes that can be written in HTML or Markdown
 */
export type TextType = "html" | "markdown";

/**
 * Markdown utilities
 */
export class Markdown {

	/**
	 * Render markdown to sanitized HTML
	 *
	 * Markdown may contain raw HTML so the output is always sanitized. Images are styled like the HTML editor does
	 * so they fit the width and keep their aspect ratio.
	 *
	 * @param markdown
	 */
	public static toHtml(markdown: string): string {
		const fragment = DOMPurify.sanitize(marked.parse(markdown, {gfm: true, breaks: true}), {
			...Markdown.sanitizeConfig,
			RETURN_DOM_FRAGMENT: true
		});

		fragment.querySelectorAll("img").forEach(Markdown.styleImage);

		const div = document.createElement("div");
		div.append(fragment);
		return div.innerHTML;
	}

	/**
	 * Like StringUtil::sanitizeHtml() on the server, also forbid style blocks and forms that could change or mimic the UI.
	 */
	private static sanitizeConfig = {
		FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select"]
	};

	/**
	 * Sanitize HTML to prevent XSS
	 *
	 * @param html
	 */
	public static sanitize(html: string): string {
		return DOMPurify.sanitize(html, Markdown.sanitizeConfig);
	}

	/**
	 * Add the image size to an image URL so the aspect ratio is known before the image loads.
	 *
	 * @see styleImage()
	 * @param url
	 * @param width
	 * @param height
	 */
	public static addImageSize(url: string, width: number, height: number): string {
		return url + (url.includes("?") ? "&" : "?") + `w=${width}&h=${height}`;
	}

	/**
	 * Fit the image to the width and set the aspect ratio when the size is in the URL. Same as the HTML editor.
	 *
	 * @param img
	 */
	private static styleImage(img: HTMLImageElement) {
		img.style.maxWidth = "100%";
		img.style.height = "auto";

		const m = /[?&]w=(\d+)&h=(\d+)/.exec(img.getAttribute("src") ?? "");
		if (m) {
			img.style.aspectRatio = `${m[1]} / ${m[2]}`;
		}
	}

	/**
	 * Get the content as HTML. Markdown is rendered, HTML is returned as is.
	 *
	 * @param content
	 * @param type
	 */
	public static contentToHtml(content: string, type: TextType = "html"): string {
		return type === "markdown" ? Markdown.toHtml(content) : content;
	}
}
