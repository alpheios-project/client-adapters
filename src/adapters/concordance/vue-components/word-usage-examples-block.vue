<template>
  <div>
    <div class="alpheios_word_usage_list_title">{{ targetWord }} ({{ language }})</div>
    <div class="alpheios_word_usage_list_mainblock">
      <div class="alpheios_word_usage_list_item" 
           v-for="wordUsageItem in wordUsageList"
           v-bind:key="wordUsageItem.ID"
      >{{ wordUsageItem.prefix }}</div>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'WordUsageExamplesBlock',
    props: {
      wordUsageList: {
        type: Array,
        required: true
      },
      targetWord: {
        type: String,
        required: true
      },
      language: {
        type: String,
        required: true
      }
    }
  }
</script>
<style lang="scss">
    @import "../styles/alpheios";
</style>