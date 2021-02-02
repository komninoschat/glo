<template lang="pug">
  Portal(selector="body")
    .popup(:class="darkmode ? 'darkmode' : ''")
      .popup-body-wrapper
        .popup-body(v-click-outside="close")
          FontAwesomeIcon.close(icon="times" @click="close" fixed-width)
          .title(v-if="title") {{ title }}
          slot
    div(class="portalBugFix")
</template>

<style lang="stylus">
.popup
  position fixed
  top 0
  left 0
  height 100vh
  width 100vw
  background rgba(0,0,0,0.12)
  z-index 10
  display flex
  justify-content center
  align-items center
  cursor pointer
  flex-direction column
  .popup-body-wrapper
    position relative
  .popup-body
    background white
    border-top 30px solid white
    border-bottom @border-top
    border-left 50px solid white
    border-right @border-left
    border-radius 5px
    cursor auto
    text-align center
    max-width calc(100vw - 100px)
    max-height calc(100vh - 100px)
    .close
      position absolute
      right 10px
      top 7px
      cursor pointer
    .title
      font-size 24px
      margin-bottom 20px
      pointer-events none
  &.darkmode
    background rgba(255,255,255,0.12)
    .popup-body
      background black
      border-top 30px solid @background
      border-bottom @border-top
      border-left 50px solid @background
      border-right @border-left
      .title
      .close
        color white
      textarea
        background black
        color white
</style>

<script lang="ts">
import 'reflect-metadata';
import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';

import { Portal } from '@linusborg/vue-simple-portal'
import vClickOutside from 'v-click-outside';

import ButtonPrimary from './ButtonPrimary.vue';

@Component({
  components: {
    Portal,
    ButtonPrimary,
  },
  directives: {
    clickOutside: vClickOutside.directive
  }
})
export default class Popup extends Vue {
  @Prop() darkmode!: boolean;
  @Prop({ default: null }) title!: string|null;
  @Emit('close')
  close() {}
}
</script>