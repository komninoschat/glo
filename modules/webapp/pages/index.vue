<template lang="pug">
  .page(ref="page" @change="fullscreenChange")
    Header(
      :interpreting="interpreting"
      :stepInterpreting="stepInterpreting"
      :animating="animating"
      :fullscreen="fullscreen"
      :darkmode="darkmode"
      :actionBeingPerformed="actionBeingPerformed"
      :lastStep="lastStep"
      @interpret="interpret"
      @stepInterpret="stepInterpret"
      @nextStep="nextStep"
      @stop="stop"
      @stopStep="stopStep"
      @toggleFullscreen="toggleFullscreen"
      @toggleDarkmode="toggleDarkmode"
      @animate="animate"
      @reduceFontSize="reduceFontSize"
      @increaseFontSize="increaseFontSize"
      @download="download"
    )
    codemirror.editor(
      ref="editor"
      v-model="appropriateSourceCode"
      :options="options"
      :class="{darkmode: darkmode, 'scope-shown': currentStepScope}"
      :style="{fontSize}"
      @focus="clearError"
    )
    SymbolScope.symbol-scope(
      v-if="currentStepScope && !currentStepScopeIsBaseScope"
      :scope="currentStepScope"
      :node="currentNode"
      :darkmode="darkmode"
    )
    ol.console(
      ref="console"
      :class="darkmode ? 'darkmode' : ''"
      :style="{fontSize}"
    )
      .placeholder(
        v-show="(!console || !console.length) && !readFunction"
      ) Κονσόλα εισόδου/εξόδου
      li(
        :style="{'min-height': fontSize}"
        v-for="item in console"
        v-html="item"
      )
      input.read-input(
        rf="readInput"
        v-model="read"
        v-show="readFunction"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        @keyup.enter="submitRead"
        @blur="submitReadOnMobile"
      )
</template>

<style lang="stylus" scoped>
header-height = 70px
console-height = 200px
console-height-mobile = 150px
console-margin = 5px

read-color = #fcba03
read-color-dark = #634903

symbol-scope-width = 300px

>>> .header
  height header-height

.page
  background white
  position relative

.editor
  height "calc(100vh - %s - %s)" % (header-height console-height)
  font-family "Roboto Mono", monospace
  outline none
  line-height 1.25
  @media (max-width 600px)
    height "calc(100vh - %s - %s)" % (header-height console-height-mobile)
  >>> .CodeMirror
    height "calc(100vh - %s - %s)" % (header-height console-height)
    @media (max-width 600px)
      height "calc(100vh - %s - %s)" % (header-height console-height-mobile)
    padding-top 5px
  >>> .read
    background read-color
  >>> .error
    background rgba(255, 0, 0, 0.35)
  >>> .step
    background cyan
  >>> *
    line-height 1
    font-family "Roboto Mono", monospace
  &.scope-shown
    margin-right symbol-scope-width
  &.darkmode
    >>> .read
      background read-color-dark
    >>> .step
      background #007e82

.symbol-scope
  position absolute
  top header-height
  bottom console-height
  right 0
  width symbol-scope-width

.console
  height console-height
  width 100%
  outline none
  margin 0
  padding 10px 15px
  border 0
  font-family "Roboto Mono", monospace
  border-top 1px solid rgba(65,65,65,0.5)
  line-height 1.25
  position relative
  z-index 5
  background white
  overflow-y scroll
  @media (max-width 600px)
    padding 10px 12px
    height console-height-mobile
  >>> .error
    color #dc3545
    font-weight bold
  >>> .info
    color #1034A6
    font-weight bold
  >>> .read
    color #8a6606
  .placeholder
    color rgba(65,65,65,0.5)
    font-weight bold
    pointer-events none
    user-select none
  .read-input
    appearance none
    border 0
    width 100%
    font-size 17px
    outline 0
    background read-color
  &.darkmode
    background black
    color #f8f8ff
    >>> .info
      color #143ec9
    .placeholder
      color rgba(190,190,190,0.6)
    .read-input
      background read-color-dark
</style>

<script lang="ts">
import 'reflect-metadata';
import { Component, Vue } from 'nuxt-property-decorator';
import gloInterpret, { Options as GloOptions} from '@glossa-glo/glo';
import GLOError, { DebugInfoProviderLike } from '@glossa-glo/error';
import { ArrayAccessAST, AST, ProgramAST } from '@glossa-glo/ast';

import { CodeMirror, codemirror } from 'vue-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/addon/selection/active-line.js'
import 'codemirror/addon/selection/mark-selection.js'

import '../glossa.js'

import store from '../store';

import Header from '../components/Header.vue';
import SymbolScopeComponent from '../components/SymbolScope.vue';
import { BaseSymbolScope, SymbolScope } from '@glossa-glo/symbol';
import { VariableDeclarationAST, ConstantDeclarationAST, ProcedureDeclarationAST, FunctionDeclarationAST, VariableAST } from '@glossa-glo/ast';

function addMissingTrailingNewline(str: string) {
  return str[str.length - 1] === '\n' ? str : str + '\n'
}

@Component({
  components: {
    Header,
    codemirror,
    SymbolScope: SymbolScopeComponent,
  },
  mixins: [require('vue-save-state').default]
})
export default class InterpreterPage extends Vue {
  $refs!: {
    page: Element,
    console: Element,
    editor: any,
  };

  error: any = null;

  clearError() {
    if(this.error) {
      this.error.clear();
      this.error = null;
    }
  }

  highlightError(debugInfoProvider: DebugInfoProviderLike) {
    this.clearError();
    const cm = this.$refs.editor.codemirror;

    this.error = cm.markText({
      line: debugInfoProvider.start.linePosition,
      ch: debugInfoProvider.start.characterPosition
    },{
      line: debugInfoProvider.end.linePosition,
      ch: debugInfoProvider.end.characterPosition
    }, {className: 'error'});
  }

  readHighlight: any = null;

  clearReadHighlight() {
    if(this.readHighlight) {
      this.readHighlight.clear();
      this.readHighlight = null;
    }
  }

  highlightRead(debugInfoProvider: DebugInfoProviderLike) {
    this.clearReadHighlight();
    const cm = this.$refs.editor.codemirror;

    this.readHighlight = cm.markText({
      line: debugInfoProvider.start.linePosition,
      ch: debugInfoProvider.start.characterPosition
    },{
      line: debugInfoProvider.end.linePosition,
      ch: debugInfoProvider.end.characterPosition
    }, {className: 'read'});
  }

  highlightLine(line: number, type: 'read'|'step') {
    const cm = this.$refs.editor.codemirror;

    cm.addLineClass(line, 'background', type);
  }

  unhighlightLine(line: number, type: 'read'|'step') {
    const cm = this.$refs.editor.codemirror;

    cm.removeLineClass(line, 'background', type);
  }

  sourceCode: string = '';
  console: string[] = [];
  read = '';
  interpreting = false;
  stepInterpreting = false;
  lastStep = false;
  animating = false;
  readFunction: ((reading: string, rejectPromise?: boolean) => void) | null = null;

  get actionBeingPerformed() {
    return this.interpreting || this.stepInterpreting || this.lastStep || this.animating;
  }

  get appropriateSourceCode() {
    return !this.animating ? this.sourceCode : this.sourceCodeCopy;
  }

  set appropriateSourceCode(value: string) {
    if(!this.animating) this.sourceCode = value;
    else this.sourceCodeCopy = value;
  }

  get options() {
    return {
      tabSize: 4,
      lineNumbers: !this.isMobile,
      line: true,
      readOnly: this.actionBeingPerformed,
      theme: !this.darkmode ? 'eclipse' : 'darcula',
      mode: 'text/x-glossa',
      styleActiveLine: !this.isMobile,
      styleSelectedText: true
    }
  }

  download() {
    const blob = new Blob([
        new Uint8Array([0xEF, 0xBB, 0xBF]), // UTF-8 BOM
        this.sourceCode
      ], {
      type: 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'program.glo';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  }

  consoleNewLine(message: string, type?: 'program-error'|'error'|'info'|'read', line?: number) {
    let str;
    if(!type) {
      str = `<div>${message}</div>`
    } else if(type === 'info') {
      str = `<div class="info">Ενημέρωση: ${message}</div>`;
    } else if(type === 'read') {
      str = `<div class="read">${message}</div>`;
    } else if(type === 'error') {
      str = `<div class="error">${line ? `Γραμμή ${line}: ` : ''}Σφάλμα: ${message}</div>`;
    } else if(type === 'program-error') {
      str = `<div class="error">Σφάλμα Διερμηνευτή: ${message}</div>`;
    }

    this.console.push(str);

    setTimeout(() => {
      if(this.$refs.console) {
        if(this.readFunction)
          this.$refs.console.lastElementChild!.scrollIntoView(true);
        else
          this.$refs.console.lastElementChild!.previousElementSibling!.scrollIntoView(true);
      }
    });
  }

  consoleReset() {
    this.console = [];
  }

  submitRead() {
    if (this.readFunction) {
      this.consoleNewLine(this.read, 'read');
      this.readFunction(this.read);
      this.read = '';
      this.readFunction = null;
    }
  }

  submitReadOnMobile() {
    if(this.isMobile) {
      return this.submitRead();
    }
  }

  async interpret(options?: Partial<GloOptions>, ignoreActionBeingPerformed = false) {
    if (!ignoreActionBeingPerformed && this.actionBeingPerformed) return;

    this.clearError();

    this.consoleReset();
    if(!ignoreActionBeingPerformed) this.interpreting = true;

    await new Promise(resolve => {
      setTimeout(resolve, 100);
    })

    let localInputFile = store.inputFile;

    if(localInputFile) {
      this.consoleNewLine('Διαβάζω από αρχείο εισόδου', 'info')
      localInputFile = addMissingTrailingNewline(localInputFile);
    }

    try {
      await gloInterpret(
        addMissingTrailingNewline(this.sourceCode),
        {
          ...options,
          read: (debugInfoProvider: DebugInfoProviderLike) => {
            if(!store.inputFile) {
              this.highlightRead(debugInfoProvider);
              return new Promise((resolve,reject) => {
                this.readFunction = (reading: string, rejectPromise = false) => {
                  this.clearReadHighlight();

                  if(rejectPromise) {
                    this.read = '';
                    this.readFunction = null;
                    return reject();
                  }

                  return resolve(reading);
                };
              });
            } else {
              const indexOfFirstNewLine = localInputFile.indexOf('\n');

              if(indexOfFirstNewLine === -1) {
                return Promise.resolve('');
              }

              const line = localInputFile.substring(0, indexOfFirstNewLine);
              this.consoleNewLine(line, 'read');
              localInputFile = localInputFile.substring(indexOfFirstNewLine + 1)
              return Promise.resolve(line);
            }
          },
          write: (...data) => {
            this.consoleNewLine(data.join(' '));
            return Promise.resolve();
          },
        },
      );
    } catch (_error) {
      if (_error instanceof GLOError) {
        let error = _error as GLOError;
        const canEvalLine =
          error.start.linePosition !== -1 &&
          error.start.characterPosition !== -1 &&
          error.end.characterPosition !== -1;

        this.consoleNewLine(error.message, 'error', canEvalLine ? error.start.linePosition : undefined);
        if (canEvalLine)
          this.highlightError(error);
      } else if(_error) {
        this.consoleNewLine(_error, 'program-error');
      }
    }

    if(!ignoreActionBeingPerformed) this.interpreting = false;
  }

  stepInterpretFunction: (nextLine: number, rejectPromise?: boolean) => void = () => { return; };
  nextLine = 0;
  currentStepScope: SymbolScope|null = null;
  currentNode: AST|null = null;

  get currentStepScopeIsBaseScope() {
    return this.currentStepScope && this.currentStepScope.type === 'root';
  }

  async nextStep() {
    if(this.stepInterpreting && this.stepInterpretFunction) {
      this.stepInterpretFunction(this.nextLine);
    }
  }

  async stepInterpret() {
    if(this.currentStepScope) {
      return this.currentStepScope = null;
    }

    this.stepInterpreting = true;

    let currentLine: number|null = null;

    return this.interpret({
      interceptor: (node, scope) => {
        return new Promise((resolve, reject) => {
          this.currentNode = node;
          const line = node.start.linePosition;

          const ignoreList = [
            ProgramAST,
            VariableDeclarationAST,
            ConstantDeclarationAST,
            ProcedureDeclarationAST,
            FunctionDeclarationAST,
            VariableAST,
            ArrayAccessAST,
          ];

          for(const Constructor of ignoreList) {
            if(node instanceof Constructor) {
              return resolve();
            }
          }

          if(line === currentLine || line === -1) {
            return resolve();
          } else {
            if(currentLine === null) currentLine = line;

            this.highlightLine(line, 'step');
            this.stepInterpretFunction = (nextLine: number, rejectPromise = false) => {
              if(rejectPromise) {
                this.unhighlightLine(line, 'step');
                this.currentStepScope = null;
                return reject();
              }
              this.unhighlightLine(line, 'step');
              currentLine = nextLine;
              this.currentStepScope = scope;
              return resolve();
            };
            this.nextLine = line;
          }
        })
      }
    }, true).then(() => {
      this.stepInterpreting = false;
      this.nextLine = 0;
      if(this.currentStepScope) {
        this.lastStep = true;
      }
    });
  }

  async stop() {
    if(this.animating) {
      return this.stopAnimate();
    }

    if(this.readFunction) {
      this.readFunction('', true);
    }

    if(this.stepInterpretFunction) {
      await this.stepInterpretFunction(this.nextLine, true);
    }
  }

  stopStep() {
    this.lastStep = false;
    this.currentStepScope = null;
  }

  fullscreen: boolean = false;
  fullscreenChange(fullscreen: boolean) {
    this.fullscreen = fullscreen;
  }
  toggleFullscreen() {
    this.$fullscreen.toggle(this.$refs.page, {
      wrap: false,
      callback: this.fullscreenChange,
    });
  }

  darkmode = false;
  toggleDarkmode() {
    this.darkmode = !this.darkmode;
  }

  sourceCodeCopy = '';
  animateInterval: any = null;
  animate() {
    if(this.actionBeingPerformed) return;

    this.clearError();
    this.consoleReset();

    if(this.sourceCode.split('\n').length < 3) {
      this.consoleNewLine('Γράψε τουλάχιστον 3 γραμμές κώδικα για την λειτουργία Animation', 'error');
    }

    this.animating = true;
    let i = 0;
    this.animateInterval = setInterval(() => {
      while(/\s/.test(this.sourceCode[i])) {
        this.sourceCodeCopy += this.sourceCode[i++];
      }

      if(this.sourceCodeCopy.length >= this.sourceCode.length) {
        clearInterval(this.animateInterval);
        this.animating = false;
        this.sourceCodeCopy = '';
        return
      }

      this.sourceCodeCopy += this.sourceCode[i++];
    }, 100)
  }

  stopAnimate() {
    clearInterval(this.animateInterval);
    this.animating = false;
    this.sourceCodeCopy = '';
  }

  fontSize = '17px';
  increaseFontSize() {
    const currentFontSize = parseInt(this.fontSize.slice(0, -2));

    if(currentFontSize < 30)
      this.fontSize = currentFontSize + 1 + 'px';
  }
  reduceFontSize() {
    const currentFontSize = parseInt(this.fontSize.slice(0, -2));

    if(currentFontSize > 13)
      this.fontSize = currentFontSize - 1 + 'px';
  }

  isMobile: boolean = false;
  created() {
    this.isMobile = innerWidth <= 600;
    if(this.isMobile) {
      this.fontSize = '16px';
    }
  }

  getSaveStateConfig() {
    return {
      cacheKey: 'glo',
      saveProperties: ['sourceCode', 'darkmode', 'fontSize']
    };
  }
}
</script>
