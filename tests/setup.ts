/**
 * Browser globals that jsdom has but jsdom-global doesn't expose
 */
for (const name of ["Option", "Window"]) {
	(globalThis as any)[name] ??= (window as any)[name];
}
