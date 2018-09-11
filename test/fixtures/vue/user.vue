<template>
  <p>{{user && user.name}}</p>
</template>

<script>
  export default {
    props: ['user'],
  }
</script>