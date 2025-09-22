<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let label: string = '';
    export let description: string = '';
    export let disabled: boolean = false;

    const dispatch = createEventDispatcher();

    function handleClick() {
        if (!disabled) {
            dispatch('click');
        }
    }
</script>

<button 
    class="button-container" 
    on:click={handleClick} 
    {disabled}
>
    {#if label || description}
        <div class="button-info">
            {#if label}
                <h3>{label}</h3>
            {/if}
            {#if description}
                <p>{description}</p>
            {/if}
        </div>
    {/if}
    
    <div class="button-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M9.4 18.4l-.9-.8 5.7-6.6-5.7-6.6.9-.8 6.6 7.4-6.6 7.4z"/>
        </svg>
    </div>
</button>

<style>
    .button-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
        background: #40444b;
        border-radius: 12px;
        transition: background-color 0.2s ease;
        gap: 24px;
        width: 100%;
        border: none;
        text-align: left;
        cursor: pointer;
    }

    .button-container:hover {
        background: #484c52;
    }

    .button-container:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .button-info {
        flex: 1;
    }

    .button-info h3 {
        margin: 0 0 8px 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
    }

    .button-info p {
        margin: 0;
        color: #b9bbbe;
        font-size: 14px;
        line-height: 1.4;
    }

    .button-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        flex-shrink: 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .button-container {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            text-align: center;
        }
    }
</style>
