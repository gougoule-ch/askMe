<script lang="ts">
	import { password } from '$lib/store';
	import { marked } from 'marked';
	import { onMount, tick } from 'svelte';
	import Send from '$lib/components/svg/Send.svelte';

	type Message = {
		role: string;
		content: string;
	};

	let messages: Message[] = [];
	var question = '';

	onMount(async () => {
		const unsubscribe = password.subscribe(async (pwd: string) => {
			if (pwd) {
				const response = await fetch('/api/v1/chat', {
					headers: {
						Authorization: `Bearer ${pwd}`
					}
				});
				messages = (await response.json()).map((message: Message) => {
					if (message.role === 'assistant') {
						message.content = marked.parse(message.content) as string;
					}
					return message;
				});

				scrollToBottom();
				adjustTextareaHeight();

				unsubscribe(); // Stop listening to the store after the password is used
			}
		});

		window.onkeydown = function (e: KeyboardEvent) {
			if (
				e.key === 'Enter' &&
				!e.shiftKey &&
				document.getElementById('messageTextArea') === document.activeElement &&
				!('ontouchstart' in window || navigator.maxTouchPoints > 0)
			) {
				e.preventDefault(); // Prevent the default action of Enter key
				ask();
			}
		};
	});

	function adjustTextareaHeight() {
		const scrollableMessageContainer = document.getElementById(
			'scrollableMessageContainer'
		) as HTMLElement;
		const scrolledToBottom =
			scrollableMessageContainer.scrollTop ==
			scrollableMessageContainer.scrollHeight - scrollableMessageContainer.clientHeight;

		const textarea = document.getElementById('messageTextArea') as HTMLTextAreaElement;
		textarea.style.height = 'auto'; // Reset height to calculate the new height
		const maxHeight = 8.3 * parseFloat(getComputedStyle(textarea).lineHeight); // Limit to 20 rows
		textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
		textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'scroll' : 'hidden';

		if (scrolledToBottom) {
			scrollToBottom();
		}

		updatePaddingBottom();
	}

	function updatePaddingBottom() {
		const textarea = document.getElementById('messageTextArea') as HTMLTextAreaElement;
		const paddingBottom = parseFloat(getComputedStyle(textarea).height);
		const scrollableMessageContainer = document.getElementById(
			'scrollableMessageContainer'
		) as HTMLElement;
		scrollableMessageContainer.style.paddingBottom = `${paddingBottom + 130}px`;
	}

	async function scrollToBottom() {
		await tick();
		const scrollableMessageContainer = document.getElementById(
			'scrollableMessageContainer'
		) as HTMLElement;
		const scrollHeight = scrollableMessageContainer.scrollHeight;
		scrollableMessageContainer.scrollTop = scrollHeight;
	}

	async function ask() {
		const toAsk = question.trim();
		if (!toAsk) return;
		question = '';
		await tick();
		adjustTextareaHeight();
		messages = [...messages, { role: 'user', content: toAsk }];
		messages = [...messages, { role: 'assistant', content: '' }];
		scrollToBottom();
		const response = await fetch('/api/v1/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${$password}`
			},
			body: JSON.stringify({ question: toAsk })
		});
		if (!response.ok || !response.body) {
			console.error('Error fetching response or response body is null');
			messages[messages.length - 1].content = 'Error fetching response.';
			messages = [...messages]; // Trigger reactivity
			return;
		}
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let done = false;
		let answer = '';

		while (!done) {
			const { done: doneReading, value } = await reader.read();
			done = doneReading;
			if (value) {
				const text = decoder.decode(value, { stream: true });
				answer += text;
				messages[messages.length - 1].content = answer;
				messages[messages.length - 1] = await parseMarkdownFromMessage(
					messages[messages.length - 1]
				);
				scrollToBottom();
			}
		}
	}

	async function parseMarkdownFromMessage(message: {
		role: string;
		content: string;
	}): Promise<Message> {
		message.content = await marked.parse(message.content);
		return message;
	}
</script>

<div
	class="flex h-[100dvh] flex-col items-center overflow-y-auto pt-16"
	id="scrollableMessageContainer"
>
	<div class="flex w-[700px] max-w-[100vw] flex-col gap-10 px-4 pt-4" id="messagesContainer">
		{#each messages as message}
			{#if message.role == 'assistant'}
				{@html message.content}
			{:else if message.role == 'user'}
				<p class="self-end rounded-2xl bg-zinc-800 p-3">{message.content}</p>
			{/if}
		{/each}
	</div>

	{#if messages.length == 0}
		<div>
			<h1 class="text-center text-4xl font-bold">Gougoule AI</h1>
			<p class="mt-4 text-center text-lg">Your omniscient assistant, powered by Gougoule Inc.</p>
			<p class="mt-2 text-center text-sm text-zinc-500">
				Gougoule Inc: Shaping the future, one query at a time. Trust in Gougoule.
			</p>
		</div>
	{/if}
	<div
		class="fixed bottom-6 w-[calc(100%_-_1rem)] max-w-[700px] rounded-4xl bg-zinc-800 p-3 px-5 pt-5 {messages.length ==
		0
			? 'fixed bottom-[40%]'
			: ''}"
		style="box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.5);"
	>
		<textarea
			name="message"
			id="messageTextArea"
			class="w-full resize-none outline-none"
			placeholder="What is Gougoule ?"
			on:input={adjustTextareaHeight}
			rows="1"
			bind:value={question}
		></textarea>
		<div class="flex justify-end">
			<button class="cursor-pointer rounded-full p-2 hover:bg-black hover:invert" on:click={ask}
				><Send /></button
			>
		</div>
	</div>
</div>

<style>
	:global(#messagesContainer h1) {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	:global(#messagesContainer h2) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	:global(#messagesContainer h3) {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	:global(#messagesContainer h4) {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	:global(#messagesContainer h5) {
		font-size: 0.875rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	:global(#messagesContainer h6) {
		font-size: 0.75rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	:global(#messagesContainer p) {
		font-size: 1rem;
		margin-bottom: 1rem;
	}
	:global(#messagesContainer pre > code) {
		display: block;
		width: 100%;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	:global(#messagesContainer code) {
		font-family: 'Courier New', Courier, monospace;
		background-color: #2c2c2c;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
	}
</style>
