<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Form, { ISettingItem } from "../../components/Form";

  export let group: string;
  export let settingItems: ISettingItem[];
  export let display: boolean = true;

  const dispatch = createEventDispatcher();

  function onClick({ detail }) {
    dispatch("click", { key: detail.key });
  }
  function onChanged({ detail }) {
    dispatch("changed", { group: group, ...detail });
  }

  $: fn__none = display ? "" : "fn__none";
</script>

<div class="config__tab-container {fn__none}" data-name={group}>
  <slot />
  {#each settingItems as item (item.key)}
    <Form.Wrap
      title={item.title}
      description={item.description}
      direction={item?.direction}
    >
      <Form.Input
        type={item.type}
        key={item.key}
        bind:value={item.value}
        placeholder={item?.placeholder}
        options={item?.options}
        slider={item?.slider}
        button={item?.button}
        on:click={onClick}
        on:changed={onChanged}
      />
    </Form.Wrap>
  {/each}
</div>
