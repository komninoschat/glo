// Based on pascal.js (https://github.com/codemirror/CodeMirror/blob/master/mode/pascal/pascal.js)
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// copyright (c) by Komninos Chatzipapas

// TODO: Move to separate module, take CodeMirror as parameter, toUpperCaseNormalizedGreek, idRegex from modules

import { CodeMirror } from 'vue-codemirror';

// From CaseInsensitiveMap
function toUpperCaseNormalizedGreek(s) {
  return s
    .toUpperCase()
    .replace(/Ά/g, 'Α')
    .replace(/Έ/g, 'Ε')
    .replace(/Ή/g, 'Η')
    .replace(/Ί|Ϊ|Ϊ́/g, 'Ι')
    .replace(/Ό/g, 'Ο')
    .replace(/Ύ|Ϋ|Ϋ́/g, 'Υ')
    .replace(/Ώ/g, 'Ω');
}

CodeMirror.defineMode('pseudoglossa', function () {
  function words(str) {
    const obj = {},
      words = str.split(' ');
    for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  const keywords = words(
    'DIV ΑΛΓΟΡΙΘΜΟΣ ΤΕΛΟΣ ΕΚΤΥΠΩΣΕ ΕΜΦΑΝΙΣΕ ΑΝΤΙΜΕΤΑΘΕΣΕ ' +
      'ΑΛΗΘΗΣ ΨΕΥΔΗΣ ΑΝ ΤΟΤΕ ΑΛΛΙΩΣ ΚΑΙ Η ΟΧΙ ' +
      'ΓΙΑ ΤΟ ΑΠΟ ΜΕΧΡΙ ΕΠΑΝΑΛΑΒΕ ΟΣΟ ΜΕΧΡΙΣ_ΟΤΟΥ ' +
      'ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ ΜΕ_ΒΗΜΑ ΔΕΔΟΜΕΝΑ ΑΠΟΤΕΛΕΣΜΑΤΑ ' +
      'ΔΙΑΒΑΣΕ ΓΡΑΨΕ ΑΛΛΙΩΣ_ΑΝ ΤΕΛΟΣ_ΑΝ ' +
      'ΕΠΙΛΕΞΕ ΠΕΡΙΠΤΩΣΗ ΤΕΛΟΣ_ΕΠΙΛΟΓΩΝ MOD ',
  );
  const atoms = {};

  const isOperatorChar = /[+\-*^=<>!?|\/]/;

  function tokenBase(stream, state) {
    const ch = stream.next();
    if (ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == '"') {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (ch == '!') {
      stream.skipToEnd();
      return 'comment';
    }
    if (/[\[\]\(\),\:]/.test(ch)) {
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return 'number';
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return 'operator';
    }
    stream.eatWhile(/[α-ωΑ-ΩίϊΐόάέύϋΰήώΊΪΪ́ΌΆΈΎΫΫ́ΉΏa-zA-Z0-9_]/);
    const cur = toUpperCaseNormalizedGreek(stream.current());
    if (keywords.propertyIsEnumerable(cur)) return 'keyword';
    if (atoms.propertyIsEnumerable(cur)) return 'atom';
    return 'variable';
  }

  function tokenString(quote) {
    return function (stream, state) {
      let next,
        end = false;
      while ((next = stream.next()) != null) {
        if (next == quote) {
          end = true;
          break;
        }
      }
      if (end) state.tokenize = null;
      return 'string';
    };
  }

  function tokenComment(stream, state) {
    let ch;
    while ((ch = stream.next())) {
      if (ch == '\n') {
        state.tokenize = null;
        break;
      }
    }
    return 'comment';
  }

  // Interface

  return {
    startState: function () {
      return { tokenize: null };
    },

    token: function (stream, state) {
      if (stream.eatSpace()) return null;
      const style = (state.tokenize || tokenBase)(stream, state);
      if (style == 'comment' || style == 'meta') return style;
      return style;
    },
  };
});

CodeMirror.defineMIME('text/x-pseudoglossa', 'pseudoglossa');
