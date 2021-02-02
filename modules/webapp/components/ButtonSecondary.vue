<template lang="pug">
  button.btn(
    :class="`${color} ${disabled ? 'disabled' : ''} ${animate ? 'animate' : ''}`"
    :disabled="disabled"
  )
    FontAwesomeIcon.icon(:icon="icon" :style="{...(!text && {fontSize: '1em'})}" fixed-width)
    .text(v-if="text") {{ text }}
</template>

<style lang="stylus" scoped>
.btn
  appearance none
  border 0
  border-radius 1.1875rem
  padding 12px 15px
  cursor pointer
  outline none
  display flex
  flex-direction row
  align-items center
  justify-content center
  transition all .5s
  background white
  &.disabled
    pointer-events none
  .icon
    align-self center
    font-size .9em
  .text
    align-self center
    margin-left 9px
    font-weight 600
    letter-spacing .5px

.blue
  border: 2px solid #007bff
  color #007bff
  &.animate&:hover
    background #007bff
    color white

.green
  border: 2px solid #28a745
  color #28a745
  &.animate&:hover
    background #28a745
    color white

.green
  border: 2px solid #dc3545
  color #dc3545
  &.animate&:hover
    background #dc3545
    color white

.black
  border: 2px solid #343A40
  color black
  &.animate&:hover
    background #343A40
    color white

.white
  border: 2px solid #f8f8ff
  color #f8f8ff
  background black
  &.animate&:hover
    background #f8f8ff
    color black
</style>

<script lang="ts">
import 'reflect-metadata';
import { Vue, Component, Prop } from 'nuxt-property-decorator';

@Component
export default class ButtonSecondary extends Vue {
  @Prop() icon!: string;
  @Prop() text!: string | undefined;
  @Prop() color!: string;
  @Prop({ default: false }) disabled!: boolean;
  @Prop({ default: true }) animate!: boolean;
}
</script>
