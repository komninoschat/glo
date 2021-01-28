<template lang="pug">
  .header(:class="darkmode ? 'darkmode': ''")
    template(v-if="!isPseudoglossa")
      img.logo.logo-regular(:src="!darkmode ? img('logo-day.png') : img('logo-night.png')")
      img.logo.logo-small(:src="!darkmode ? img('logo-day-small.png') : img('logo-night-small.png')")
    template(v-else)
      img.logo.logo-regular(:src="!darkmode ? img('pseudo-logo-day.png') : img('pseudo-logo-night.png')")
      img.logo.logo-small(:src="!darkmode ? img('pseudo-logo-day-small.png') : img('pseudo-logo-night-small.png')")
    .buttons
      ButtonPrimary.interpret(
        v-if="!actionBeingPerformed"
        @click.native="interpret"
        :text="!interpreting ? 'Εκτέλεση' : 'Εκτελείται...'"
        :icon="!interpreting ? 'play' : 'spinner'"
        :color="!interpreting ? 'green' : 'blue'"
      )
      ButtonPrimary.interpret(
        v-else
        @click.native="stop"
        text="Διακοπή"
        icon="stop"
        color="red"
      )
      ButtonPrimary.interpret-small(
        v-if="!actionBeingPerformed"
        @click.native="interpret"
        :icon="!interpreting ? 'play' : 'spinner'"
        :color="!interpreting ? 'green' : 'blue'"
        :disabled="actionBeingPerformed"
      )
      ButtonPrimary.interpret-small(
        v-else
        @click.native="stop"
        icon="stop"
        color="red"
      )
      ButtonSecondary.step-interpret(
        @click.native="stepFunction"
        :text="!stepInterpreting ? !lastStep ? 'Βηματική Εκτέλεση' : 'Τέλος Εκτέλεσης' : 'Επόμενο Βήμα'"
        :icon="!stepInterpreting ? !lastStep ? 'walking' : 'stop' : 'forward'"
        :color="!darkmode ? 'black' : 'white'"
        :disabled="actionBeingPerformed && !stepInterpreting && !lastStep"
      )
      ButtonSecondary.step-interpret-small(
        @click.native="stepFunction"
        :icon="!stepInterpreting ? !lastStep ? 'walking' : 'stop' : 'forward'"
        :color="!darkmode ? 'black' : 'white'"
        :disabled="actionBeingPerformed && !stepInterpreting && !lastStep"
      )
      ButtonSecondary.input-file(
        @click.native="toggleInputFile"
        icon="file"
        color="black"
        :color="!darkmode ? 'black' : 'white'"
      )
      ButtonSecondary.mode-switch(
        @click.native="toggleDarkmode"
        :icon="!darkmode ? 'moon' : 'sun'"
        :color="!darkmode ? 'black' : 'white'"
      )
      ButtonDropdown.more-options(
        :color="!darkmode ? 'black' : 'white'"
        :menu="dropdownMenu"
        @clickDownload="download"
        @clickAnimate="toggleAnimate"
        @clickInformation="openInformation"
        @clickGlossa="openGlossa"
        @clickPseudoglossa="openPseudoglossa"
        @clickFlash="openFlash"
      )
      ButtonSecondary.fullscreen(
        @click.native="toggleFullscreen"
        :icon="!fullscreen ? 'expand' : 'compress'"
        :color="!darkmode ? 'black' : 'white'"
      )
    .zoom
      FontAwesomeIcon(icon="search-plus" @click="increaseFontSize" :class="darkmode ? 'darkmode' : ''" fixed-width)
      FontAwesomeIcon(icon="search-minus" @click="reduceFontSize" :class="darkmode ? 'darkmode' : ''" fixed-width)
    Prompt(
      v-if="showInputFile"
      title="Αρχείο εισόδου"
      buttonText="Υποβολή"
      @close="closeInputFilePrompt"
      @submit="submitInputFile"
      :startValue="inputFile"
      :darkmode="darkmode"
    )
</template>

<style lang="stylus" scoped>
.header
  box-shadow 0px 0px 5px 0px rgba(65,65,65,0.5)
  display flex
  align-items center
  flex-direction row
  justify-content space-between
  padding 0 30px
  background white
  position relative
  z-index 5
  .logo
    height 35px
  .buttons
    display flex
    flex-direction row
    align-items center
    > *
      margin-right 15px
      height 40px
      &:last-child
        margin-right 0
  .zoom
    font-size 1.1em
    > *
      cursor pointer
      &:first-child
        margin-right 12px
      &.darkmode
        color #f8f8ff
  &.darkmode
    background black

.step-interpret-small
  display none
@media (max-width 940px)
  .step-interpret
    display none
  .step-interpret-small
    display block

.logo-small
  display none
@media (max-width 795px)
  .logo-regular
    display none
  .logo-small
    display block

.interpret-small
  display none
@media (max-width 670px)
  .more-options
  .fullscreen
    display none
@media (max-width 550px)
  .interpret
  .mode-switch
  .step-interpret
  .step-interpret-small
  .input-file
  .more-options
  .fullscreen
  .zoom
    display none
  .interpret-small
    display block
  .header
    padding 0 12px
    .buttons
      > *
        margin-right 0
</style>

<script lang="ts">
import 'reflect-metadata';
import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';

import Prompt from '../components/Prompt.vue';
import ButtonPrimary from '../components/ButtonPrimary.vue';
import ButtonSecondary from '../components/ButtonSecondary.vue';
import ButtonDropdown from '../components/ButtonDropdown.vue';

import store from '../store';

@Component({
  components: {
    ButtonPrimary,
    ButtonSecondary,
    ButtonDropdown,
    Prompt,
  },
})
export default class Header extends Vue {
  @Prop() interpreting!: boolean;
  @Prop() stepInterpreting!: boolean;
  @Prop() animating!: boolean;
  @Prop() fullscreen!: boolean;
  @Prop() darkmode!: boolean;
  @Prop() actionBeingPerformed!: boolean;
  @Prop() lastStep!: boolean;
  @Prop() isPseudoglossa!: boolean;

  showInputFile = false;

  toggleInputFile() {
    this.showInputFile = !this.showInputFile;
  }
  closeInputFilePrompt() {
    this.showInputFile = false;
  }
  submitInputFile(value: string) {
    store.inputFile = value;
  }
  get inputFile() {
    return store.inputFile;
  }

  @Emit('toggleDarkmode')
  toggleDarkmode() {}

  @Emit('interpret')
  interpret() {}


  stepFunction() {
    if(this.lastStep) {
      return this.stopStep()
    } else if(!this.stepInterpreting) {
      return this.stepInterpret();
    } else this.nextStep();
  }
  @Emit('nextStep')
  nextStep() {}
  @Emit('stepInterpret')
  stepInterpret() {}

  stop() {
    if(!this.lastStep) {
      this.$emit('stop');
    } else {
      this.$emit('stopStep');
    }
  }

  @Emit('stopStep')
  stopStep() {}

  @Emit('toggleFullscreen')
  toggleFullscreen() {}

  @Emit('animate')
  animate() {}

  @Emit('stopAnimate')
  stopAnimate() {}

  @Emit('download')
  download() {}

  toggleAnimate() {
    if(!this.animating) return this.animate();
    else return this.stopAnimate();
  }

  @Emit('reduceFontSize')
  reduceFontSize() {}

  @Emit('increaseFontSize')
  increaseFontSize() {}

  openInformation() {
    window.location.href = '/info.html';
  }

  openFlash() {
    window.location.href = 'http://pseudoglossa.skepto.gr'
  }

  openGlossa() {
    window.location.href = 'http://gloglossa.gr'
  }

  openPseudoglossa() {
    window.location.href = 'http://pseudo.gloglossa.gr'
  }

  img(filename: string) {
    return require(`../assets/img/${filename}`)
  }

  dropdownMenu = [ ['Αποθήκευση', 'Download'], ['Animate', 'Animate'], ['Πληροφορίες', 'Information'] ];

  mounted() {
    if(this.isPseudoglossa) this.dropdownMenu.push(['Flash', 'Flash'])

    if(!this.isPseudoglossa) this.dropdownMenu.push(['Ψευδογλώσσα', 'Pseudoglossa'])
    else this.dropdownMenu.push(['Γλώσσα', 'Glossa'])
  }
}
</script>
