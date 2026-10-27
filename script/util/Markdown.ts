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
	 * Markdown may contain raw HTML so the output is always sanitized.
	 *
	 * @param markdown
	 */
	public static toHtml(markdown: string): string {
		return Markdown.sanitize(marked.parse(markdown, {gfm: true, breaks: true}));
	}

	/**
	 * Sanitize HTML to prevent XSS
	 *
	 * @param html
	 */
	public static sanitize(html: string): string {
		// Like StringUtil::sanitizeHtml() on the server, also forbid style blocks and forms that could change or mimic the UI.
		return DOMPurify.sanitize(html, {
			FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select"]
		});
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
