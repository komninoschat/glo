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
      :isPseudoglossa="isPseudoglossa"
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
        v-for="c in console"
      )
        div.info-console(
          v-if="c.type === 'info'"
        ) {{ c.message }}
        div.read-console(
          v-else-if="c.type === 'read'"
        )
          .label {{ c.label }}
          .reading {{ c.message }}
        div.error-console(
          v-else-if="c.type === 'error'"
        ) {{ c.message }}
        div(
          v-else
        ) {{ c.message }}
      .prompt(v-show="showPrompt")
        span(:style="{fontSize}" v-if="promptLabel") {{ promptLabel }}
        input.prompt-input(
          rf="readInput"
          v-model="promptValue"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          @keyup.enter="submitPrompt"
          @blur="submitPromptOnMobile"
          :style="{fontSize}"
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
  >>> .error-console
    color #dc3545
    font-weight bold
  >>> .info-console
    color #1034A6
    font-weight bold
  >>> .read-console
    display flex
    .label
      padding-right 7px
    .reading
      color #8a6606
  .placeholder
    color rgba(65,65,65,0.5)
    font-weight bold
    pointer-events none
    user-select none
  .prompt
    background read-color
    display flex
    justify-content center
    span
      white-space nowrap
      padding-right 7px
    .prompt-input
      display inline-block
      appearance none
      border 0
      width 100%
      outline 0
      background transparent
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
import { Component, Vue, Watch } from 'nuxt-property-decorator';
import { Options as InterpreterOptions} from '@glossa-glo/glo';
import GLOError, { DebugInfoProvider } from '@glossa-glo/error';
import { ArrayAccessAST, AST, ProgramAST } from '@glossa-glo/ast';

import { CodeMirror, codemirror } from 'vue-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/addon/selection/active-line.js'
import 'codemirror/addon/selection/mark-selection.js'

import '../glossa.js'
import '../pseudoglossa.js'

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

  highlightError(debugInfoProvider: DebugInfoProvider) {
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

  highlightRead(debugInfoProvider: DebugInfoProvider) {
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
  console: {
    type?: string,
    message: string,
    [key: string]: any
  }[] = [];
  interpreting = false;
  stepInterpreting = false;
  lastStep = false;
  animating = false;
  readFunction: ((reading: string, values?: { accessors: number[]; value: string }[], rejectPromise?: boolean) => void) | null = null;
  dimensions = 0;

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
      mode: this.lang,
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
    if(!type) {
      this.console.push({ message })
    } else if(type === 'info') {
      this.console.push({ type: 'info', message })
    } else if(type === 'read') {
      this.console.push({ type: 'read', message, label: this.promptLabel })
    } else if(type === 'error') {
      this.console.push({ type: 'error', message: `${line ? `Γραμμή ${line}: ` : ''}Σφάλμα: ${message}` })
    } else if(type === 'program-error') {
      this.console.push({ type: 'error', message: `Σφάλμα Διερμηνευτή: ${message}` })
    }

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

  promptValue = '';
  promptLabel  = '';
  showPrompt = false;
  promptResolve: ((string) => any)|null = null;
  prompt(label: string = ''): Promise<string> {
    return new Promise(resolve => {
      this.promptValue = '';

      this.showPrompt = true;
      this.promptLabel = label;
      this.promptResolve = (a: string) => {
        this.showPrompt = false;
        return resolve(a);
      };
    })
  }

  submitPrompt() {
    if (this.readFunction) {
      this.consoleNewLine(this.promptValue, 'read');
      this.promptResolve!(this.promptValue);
    }
  }

  submitPromptOnMobile() {
    if(this.isMobile) {
      return this.submitPrompt();
    }
  }

  @Watch('readFunction')
  async readInput() {
    try {
      if(this.readFunction) {
        if(!this.dimensions)
          this.readFunction(await this.prompt())
        else {
          const dimensionLength = await this.prompt('Δώσε μου τις διαστάσεις του πίνακα(χωρισμένες με κόμμα):')
            .then((r: string) =>
              r
                .trim()
                .replace(/^\[/, '')
                .replace(/\]$/, '')
                .split(',')
                .map(r => r.trim())
                .map(r => {
                  if (!/^\d+$/.test(r)) {
                    this.consoleNewLine(
                      `Μη έγκυρη τιμή για διάσταση πίνακα '${r}'`,
                      'error'
                    );
                    this.stop();
                    throw '';
                  }
                  return r;
                })
                .map(r => parseInt(r))
                .map(r => {
                  if(!(r >= 1)) {
                    this.consoleNewLine(
                      `Μη έγκυρη τιμή για διάσταση πίνακα '${r}' (κάθε διάσταση πρέπει να είναι μεγαλύτερη ή ίση του 1)`,
                      'error'
                    );
                    this.stop();
                    throw '';
                  }
                  return r;
                })
            );
          if (dimensionLength.length !== this.dimensions) {
            this.consoleNewLine(
              `Ο πίνακας χρησιμοποιείται στον αλγόριθμο με ${this.dimensions} ${
                    this.dimensions === 1 ? 'διάσταση' : 'διαστάσεις'
                  } ενώ για διάβασμα δώθη${
                    dimensionLength.length === 1 ? 'κε' : 'καν'
                  } ${dimensionLength.length} ${
                    dimensionLength.length === 1 ? 'διάσταση' : 'διαστάσεις'
                  }`,
              'error'
            );
            return await this.stop();
          }

          const reads: { accessors: number[]; value: string }[] = [];
          const recurseRead = async (i = 0, accessors: number[] = []) => {
            if (dimensionLength.length === i) {
              reads.push({
                accessors,
                value: await this.prompt(
                  `Δώσε τιμή πίνακα [${accessors.join(', ')}]:`,
                ),
              });
            } else {
              for (let j = 1; j <= dimensionLength[i]; j++) {
                await recurseRead(i + 1, [...accessors, j]);
              }
            }
          }
          await recurseRead();
          this.readFunction('', reads);
        }
      }
    } catch {}
  }

  async interpret(options?: Partial<InterpreterOptions>, ignoreActionBeingPerformed = false) {
    if (!ignoreActionBeingPerformed && this.actionBeingPerformed || !this.interpreter) return;

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
      await this.interpreter(
        addMissingTrailingNewline(this.sourceCode),
        {
          ...options,
          read: (debugInfoProvider: DebugInfoProvider, dimensions: number) => {
            if(!store.inputFile) {
              this.highlightRead(debugInfoProvider);
              return new Promise((resolve,reject) => {
                this.dimensions = dimensions;
                this.readFunction = (reading: string, values?: { accessors: number[]; value: string }[], rejectPromise = false) => {
                  this.clearReadHighlight();

                  if(rejectPromise) {
                    this.readFunction = null;
                    this.showPrompt = false;
                    return reject();
                  }

                  return resolve({reading, values});
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
    this.showPrompt = false;

    if(this.animating) {
      this.stopAnimate();
    }

    if(this.readFunction) {
      this.readFunction('', undefined, true);
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
  isPseudoglossa: boolean = false;
  interpreter: ((string, InterpreterOptions) => Promise<void>)|null = null;
  lang = '';
  async created() {
    this.isMobile = innerWidth <= 600;
    if(this.isMobile) {
      this.fontSize = '16px';
    }

    if(window.location.href.indexOf('pseudo') !== -1) {
      this.isPseudoglossa = true;
    }

    if(!this.isPseudoglossa) {
      document.title = 'GLO Διερμηνευτής της Γλώσσας';
      this.interpreter = (await import('@glossa-glo/glo')).default;
      this.lang = 'text/x-glossa';
    } else {
      document.title = 'PS Διερμηνευτής της Ψευδογλώσσας'
      this.interpreter = (await import('@glossa-glo/ps')).default;
      this.lang = 'text/x-pseudoglossa';
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
