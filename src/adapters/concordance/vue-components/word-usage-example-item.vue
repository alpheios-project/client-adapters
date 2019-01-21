<template>
  <div class="alpheios_word_usage_list_item">
      <div class="alpheios_word_usage_list_item__source">
          <a :href="wordUsageItem.source" target="_blank">{{ wordUsageItem.source }}</a> {{ wordUsageItem.cit }}
        </div>
      <div class="alpheios_word_usage_list_item__text" v-html="wordUsageItem.htmlExample"></div>
  </div>
</template>
<script>
  export default {
    name: 'WordUsageExampleItem',
    props: {
      wordUsageItem: {
        type: Object,
        required: true
      }
    }
  }
</script>
<style lang="scss">
    @import "../styles/alpheios";
</style>