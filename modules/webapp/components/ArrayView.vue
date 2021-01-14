<template lang="pug">
  .table-view(:class="darkmode ? 'darkmode': ''")
    template(v-if="dimensionLength.length === 1")
      .grid-one(:style="{'grid-template-columns': `repeat(${dimensionLength[0]}, 1fr)`}")
        .index.cell-gray(v-for="i in dimensionLength[0]") {{ i }}
        .value(v-for="(v, i) in array" v-if="i >= 1")
          span(v-if="v") {{ v }}
    template(v-else-if="dimensionLength.length === 2")
      .grid-two(:style="{'grid-template-columns': `repeat(${dimensionLength[1] + 1}, 1fr)`}")
        .index.index-empty.cell-gray
        .index.index-column.cell-gray(v-for="i in dimensionLength[1]") {{ i }}
        .value(v-for="(v, i) in flat2DArray" :class="{'cell-gray': i % (dimensionLength[1] + 1) == 0, 'index-row': i % (dimensionLength[1] + 1) == 0}")
          span(v-if="v") {{ v }}
    template(v-else-if="array.length === 0")
      div.cannot-display Δεν μπορώ να εμφανίσω πίνακα πάνω από 2 διαστάσεων
</template>

<style lang="stylus" scoped>
.cannot-display
  background white
  color crimson

.table-view
  
  overflow scroll
  // Small hack
  max-height calc(100vh - 2 * 30px - 2 * 100px)

  .grid-one
    display grid
    border 1px solid black
    grid-gap 1px
    background black
    > *
      padding 4px
      text-align center
      background white

  .grid-two
    display inline-grid
    border 1px solid black
    grid-gap 1px
    background black
    > *
      padding 5px
      text-align center
      background white

  .cell-gray
    background #6c757d
    color white

  .index-column
    position sticky
    top 0
    z-index 15
  .index-row
    position sticky
    left 0
    z-index 15
  .index-empty
    position sticky
    top 0
    left 0
    z-index 20

  &.darkmode
    background white
    .grid-one
    .grid-two
      border 1px solid @background
    .grid-one > *
    .grid-two > *
      background black
      color white
    .cell-gray
      background #494f54
      color white
</style>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator';

@Component
export default class ArrayView extends Vue {
  @Prop() array!: any[];
  @Prop() dimensionLength!: number[];
  @Prop() darkmode!: boolean;

  get flat2DArray() {
    // JSON stuff cause of bug possibly related to Observer
    const arr: any[] = [];
    for(let i = 1; i <= this.dimensionLength[0]; i++) {
      arr.push(i);
      for(let j = 1; j <= this.dimensionLength[1]; j++) {
        arr.push(this.array[i][j]);
      }
    }
    return arr;
  }
}
</script>