import {Component, Window} from "@intermesh/goui";

export type MediaKind = "audio" | "video";

const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "oga", "opus", "m4a", "aac", "flac", "weba"];
const VIDEO_EXTENSIONS = ["mp4", "m4v", "webm", "ogv", "mov"];

/**
 * Check if a file is audio or video
 *
 * @param nameOrType Content type like "audio/mpeg" or file name like "song.mp3"
 */
export function mediaKind(nameOrType?: string): MediaKind | undefined {
	if (!nameOrType) {
		return undefined;
	}
	const value = nameOrType.trim().toLowerCase();
	if (value.startsWith("audio/")) {
		return "audio";
	}
	if (value.startsWith("video/")) {
		return "video";
	}

	const dot = value.lastIndexOf(".");
	if (dot === -1) {
		return undefined;
	}
	const ext = value.substring(dot + 1);
	if (AUDIO_EXTENSIONS.includes(ext)) {
		return "audio";
	}
	if (VIDEO_EXTENSIONS.includes(ext)) {
		return "video";
	}
	return undefined;
}

/**
 * Window that plays an audio or video file
 *
 * The file plays in an <audio> or <video> element of this page. When Safari opens a media URL in a tab of its own,
 * it fetches it with AppleCoreMedia, which doesn't send the login cookie, so files that need a login don't play.
 */
export class MediaWindow extends Window {
	private readonly media: HTMLMediaElement;

	/**
	 * @param url Download URL of the file, sent inline
	 * @param title Window title, usually the file name
	 * @param kind Audio or video
	 */
	constructor(url: string, title: string, kind: MediaKind) {
		super();

		this.title = title;
		this.cls = "media-window " + kind;
		this.closable = true;

		if (kind === "video") {
			this.width = 900;
			this.resizable = true;
			this.maximizable = true;
		} else {
			this.width = 500;
		}

		const player = new Component(kind);
		this.media = player.el as HTMLMediaElement;
		this.media.controls = true;
		this.media.autoplay = true;
		this.media.preload = "auto";
		this.media.src = url;
		this.items.add(player);

		this.on("close", () => {
			this.media.pause();
		});
	}
}

/**
 * Play an audio or video file in a {@link MediaWindow}
 *
 * @param url Download URL of the file, sent inline
 * @param name File name, used as title and to detect the type when no type is given
 * @param type Content type like "audio/mpeg"
 * @return False when the file isn't audio or video, and nothing was opened
 */
export function viewMedia(url: string, name?: string, type?: string): boolean {
	const kind = mediaKind(type) ?? mediaKind(name);
	if (!kind) {
		return false;
	}
	new MediaWindow(url, name ?? "", kind).show();
	return true;
}

/**
 * Open a file in the browser. Audio and video play in a {@link MediaWindow}, other files open in a new tab.
 *
 * @param url Download URL of the file, sent inline
 * @param name File name
 * @param type Content type like "audio/mpeg"
 */
export function viewFile(url: string, name?: string, type?: string): void {
	if (!viewMedia(url, name, type)) {
		window.open(url, "_blank");
	}
}

// Let the ExtJS client play media with this window too, see go.util.viewFile()
if (window.go?.util) {
	go.util.viewMedia = viewMedia;
}
