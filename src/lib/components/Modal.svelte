<script lang="ts">
    import { browser } from '$app/environment';

    export let id = '';

    async function closeOverlay() {
        if (!browser) return console.debug('Ignoring non browser'); // No SSR >:(

        const overlay = document.getElementById(`modal-${id}`);
        if (overlay) {
            overlay.remove();
        } else {
            console.error('Overlay not found');
        }
    }
</script>

<div class="overlay" id="modal-{id}">
    <div class="container">
        <slot />
    </div>
    <button class="close-component colour-danger" on:click={closeOverlay}>Close</button>
</div>

<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .container {
        background-color: #2C2F33;
        width: 30rem;
        height: 13rem;
        
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
    }
</style>