import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

let server;
let createStylePackArchive;
let readStylePackArchive;
let createStylePack;
let readStylePack;
let pickStylePackSaveTarget;
let writeStylePackSaveTarget;
let StylePackStore;

before(async () => {
	globalThis.$state = (value) => value;
	const coreLib = fileURLToPath(new URL('../../svelte/src/lib/', import.meta.url));
	server = await createServer({
		root: new URL('..', import.meta.url).pathname,
		logLevel: 'silent',
		resolve: { alias: { 'virtual:kartore-host': coreLib } },
		server: { middlewareMode: true },
		appType: 'custom'
	});
	({ createStylePackArchive, readStylePackArchive } = await server.ssrLoadModule(
		'/src/svelte/stylePackArchive.ts'
	));
	({ createStylePack, readStylePack } = await server.ssrLoadModule(
		`/@fs/${coreLib}utils/stylePack.ts`
	));
	({ pickStylePackSaveTarget, writeStylePackSaveTarget } =
		await server.ssrLoadModule('/src/svelte/features.ts'));
	({ StylePackStore } = await server.ssrLoadModule('/src/svelte/stores/stylePackStore.svelte.ts'));
});

after(async () => {
	await server?.close();
	delete globalThis.$state;
});

const files = () => ({
	'manifest.json': '{"formatVersion":1}\n',
	'style/style.json': '{"version":8}\n',
	'assets/sprites/marker.svg': '<svg />',
	'assets/fonts/Inter.otf': Uint8Array.from([0x4f, 0x54, 0x54, 0x4f, 1, 2, 3])
});

const project = () => ({
	meta: {
		appVersion: '1.2.3',
		createdAt: '2026-07-25T12:34:56.000Z'
	},
	style: {
		version: 8,
		sources: {},
		layers: [{ id: 'background', type: 'background' }]
	},
	assets: {
		icons: { marker: '<svg />' },
		fonts: {
			'Inter Regular': {
				familyName: 'Inter',
				styleName: 'Regular',
				addedAt: 1234,
				bytes: Uint8Array.from([0x4f, 0x54, 0x54, 0x4f, 1, 2, 3]).buffer
			}
		}
	}
});

const openHandle = (name, bytes) => ({
	name,
	getFile: async () => ({
		name,
		arrayBuffer: async () => Uint8Array.from(bytes).buffer
	}),
	createWritable: async () => {
		throw new Error('not used');
	}
});

const archiveEntries = (archive) => {
	const entries = {};
	const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
	let offset = 0;
	while (view.getUint32(offset, true) === 0x04034b50) {
		const method = view.getUint16(offset + 8, true);
		const modifiedTime = view.getUint16(offset + 10, true);
		const modifiedDate = view.getUint16(offset + 12, true);
		const compressedSize = view.getUint32(offset + 18, true);
		const nameLength = view.getUint16(offset + 26, true);
		const extraLength = view.getUint16(offset + 28, true);
		const nameStart = offset + 30;
		const name = new TextDecoder().decode(archive.subarray(nameStart, nameStart + nameLength));
		entries[name] = { method, modifiedTime, modifiedDate };
		offset = nameStart + nameLength + extraLength + compressedSize;
	}
	return entries;
};

test('save, open, and save emits byte-identical archives', () => {
	const first = createStylePackArchive(files());
	const opened = readStylePackArchive(first);
	const second = createStylePackArchive(opened);

	assert.deepEqual(second, first);
});

test('the complete pack pipeline emits byte-identical archives after open', () => {
	const { meta, style, assets } = project();

	const first = createStylePackArchive(createStylePack(style, assets, meta));
	const opened = readStylePack(readStylePackArchive(first));
	const second = createStylePackArchive(createStylePack(opened.style, opened.assets, meta));

	assert.deepEqual(second, first);
});

test('open waits for confirmation and then loads the complete project', async () => {
	const { meta, style, assets } = project();
	const archive = createStylePackArchive(createStylePack(style, assets, meta));
	const events = [];
	globalThis.window = {
		showOpenFilePicker: async () => [openHandle('project.kartore', archive)]
	};
	const store = new StylePackStore({
		loadProject: async (opened) => events.push(opened)
	});

	try {
		await store.open();

		assert.equal(store.confirmOpen, true);
		assert.deepEqual(events, []);

		await store.replaceWithPending();

		assert.deepEqual(events, [{ style, assets }]);
		assert.equal(store.status, 'project.kartore を開きました');
	} finally {
		delete globalThis.window;
	}
});

test('an invalid pack shows an error without changing existing data', async () => {
	const { meta, style, assets } = project();
	const packFiles = createStylePack(style, assets, meta);
	packFiles['manifest.json'] =
		'{"appVersion":"2.0.0","createdAt":"2026-07-25T12:34:56.000Z","formatVersion":2}\n';
	const archive = createStylePackArchive(packFiles);
	const events = [];
	globalThis.window = {
		showOpenFilePicker: async () => [openHandle('invalid.kartore', archive)]
	};
	const store = new StylePackStore({
		setPreview: () => events.push('preview'),
		setStyle: () => events.push('style'),
		replaceSpriteIcons: async () => events.push('icons'),
		replaceStoredFonts: async () => events.push('fonts')
	});

	try {
		await store.open();

		assert.equal(store.confirmOpen, false);
		assert.equal(store.errorDialogOpen, true);
		assert.match(store.error, /newer version/);
		assert.deepEqual(events, []);
	} finally {
		delete globalThis.window;
	}
});

test('the project store retains manifest metadata across repeated saves', async () => {
	const { style, assets } = project();
	const writes = [];
	globalThis.window = {
		showSaveFilePicker: async () => ({
			name: 'project.kartore',
			getFile: async () => {
				throw new Error('not used');
			},
			createWritable: async () => ({
				write: async (bytes) => writes.push(Uint8Array.from(bytes)),
				close: async () => undefined
			})
		})
	};
	const store = new StylePackStore({
		appVersion: '1.2.3',
		getStyle: () => style,
		getSpriteIcons: () => assets.icons,
		getStoredFonts: async () => assets.fonts
	});

	try {
		await store.saveAs();
		await store.saveAs();

		assert.equal(writes.length, 2);
		assert.deepEqual(writes[1], writes[0]);
	} finally {
		delete globalThis.window;
	}
});

test('archives are independent of file-map insertion order', () => {
	const input = files();
	const reversed = Object.fromEntries(Object.entries(input).reverse());

	assert.deepEqual(createStylePackArchive(reversed), createStylePackArchive(input));
});

test('font files are stored while JSON and SVG sources use deflate', () => {
	const entries = archiveEntries(createStylePackArchive(files()));

	assert.equal(entries['assets/fonts/Inter.otf'].method, 0);
	assert.equal(entries['manifest.json'].method, 8);
	assert.equal(entries['style/style.json'].method, 8);
	assert.equal(entries['assets/sprites/marker.svg'].method, 8);
});

test('every entry uses the fixed 1980-01-01 ZIP timestamp', () => {
	const entries = archiveEntries(createStylePackArchive(files()));

	for (const entry of Object.values(entries)) {
		assert.equal(entry.modifiedTime, 0);
		assert.equal(entry.modifiedDate, 33);
	}
});

test('the native save picker can run before archive preparation', async () => {
	const events = [];
	const handle = {
		name: 'chosen.kartore',
		getFile: async () => {
			throw new Error('not used');
		},
		createWritable: async () => ({
			write: async () => events.push('write'),
			close: async () => events.push('close')
		})
	};
	globalThis.window = {
		showSaveFilePicker: async () => {
			events.push('picker');
			return handle;
		}
	};

	try {
		const target = await pickStylePackSaveTarget('project.kartore');
		events.push('prepare archive');
		await writeStylePackSaveTarget(target, Uint8Array.from([1, 2, 3]));

		assert.equal(target.name, 'chosen.kartore');
		assert.deepEqual(events, ['picker', 'prepare archive', 'write', 'close']);
	} finally {
		delete globalThis.window;
	}
});
