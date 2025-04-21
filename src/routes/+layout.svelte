<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { getCookie, setCookie } from '$lib/cookies';
	import { password } from '$lib/store';

	let { children } = $props();

	onMount(() => {
		let storedPassword = getCookie('password');
		if (!storedPassword) {
			let inputPassword = prompt('Please enter the password:') as string;
			setCookie('password', inputPassword, 365);
			storedPassword = inputPassword;
		}
		password.set(storedPassword);
	});
</script>

{@render children()}
