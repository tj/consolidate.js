<template lang="html">
  <div class="">
      <h1>{{title}}</h1>
      <ul>
          <li v-for="user in users">
              {{ user.name }}
          </li>
      </ul>
  </div>
</template>

<script>
export default {
    data: function() {
        return {
        }
    }
}
</script>

<style lang="css">
</style>
