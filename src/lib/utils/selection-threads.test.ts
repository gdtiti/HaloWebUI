import { describe, expect, it } from 'vitest';

import {
	buildSelectionThreadPrompt,
	findSelectionAnchorOffsets,
	materializeSelectionThreadMessages,
	normalizeSelectionThreads,
	type SelectionThread
} from './selection-threads';

describe('selection thread helpers', () => {
	it('normalizes invalid persisted payloads into an empty state', () => {
		expect(normalizeSelectionThreads(null)).toEqual({
			version: 1,
			items: []
		});
	});

	it('restores anchors by exact text with prefix and suffix fallback', () => {
		const text = 'Alpha Beta Gamma Beta Delta';
		const offsets = findSelectionAnchorOffsets(text, {
			start: 0,
			end: 4,
			exact: 'Beta',
			prefix: 'Gamma ',
			suffix: ' Delta'
		});

		expect(offsets).toEqual({
			start: 17,
			end: 21
		});
	});

	it('builds a quoted first-turn prompt from the selected content', () => {
		expect(buildSelectionThreadPrompt('{{SELECTED_CONTENT}}\n\n{{INPUT_CONTENT}}', '第一行\n第二行', '帮我解释')).toBe(
			'> 第一行\n> 第二行\n\n帮我解释'
		);
	});

	it('materializes persisted turns into chat messages', () => {
		const thread: SelectionThread = {
			id: 'thread-1',
			sourceMessageId: 'message-1',
			sourceMessageHash: 'hash',
			anchor: {
				start: 10,
				end: 14,
				exact: 'Beta',
				prefix: 'Alpha ',
				suffix: ' Gamma'
			},
			quote: 'Beta',
			pinned: false,
			draft: '',
			turns: [
				{
					id: 'turn-user-1',
					role: 'user',
					displayContent: '这段是什么意思？',
					requestContent: '> Beta\n\n这段是什么意思？'
				},
				{
					id: 'turn-assistant-1',
					role: 'assistant',
					content: '它表示第二个词。',
					state: 'done',
					usage: {
						total_tokens: 42
					}
				},
				{
					id: 'turn-user-2',
					role: 'user',
					displayContent: '再举个例子',
					requestContent: '再举个例子'
				}
			],
			createdAt: 1,
			updatedAt: 2
		};

		expect(materializeSelectionThreadMessages(thread)).toEqual([
			{
				role: 'user',
				content: '> Beta\n\n这段是什么意思？'
			},
			{
				role: 'assistant',
				content: '它表示第二个词。',
				usage: {
					total_tokens: 42
				}
			},
			{
				role: 'user',
				content: '再举个例子'
			}
		]);
	});
});
