nl
  : "\n"+
  ;

repeat_loop
  : "ΕΠΑΝΑΛΑΒΕ" nl statement_list "ΜΕΧΡΙΣ_ΟΤΟΥ" expression

while_loop
  : "ΟΣΟ" expression "ΕΠΑΝΑΛΑΒΕ" nl statement_list "ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ"

for_loop
  : "ΓΙΑ" (array_access | variable) "ΑΠΟ" expression "ΜΕΧΡΙ" expression "ME BHMA" expression) nl statement_list "ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ"
  ;

if
  : "ΑΝ" expression "ΤΟΤΕ" nl statement_list
  ;

if_statement
  : if ("ΑΛΛΙΩΣ_ΑΝ" expression "ΤΟΤΕ" nl statement_list)* ("ΑΛΛΙΩΣ" nl statement_list)? "ΤΕΛΟΣ_ΑΝ"
  ;

select_case
  : ("=" | "<>" | "<" | ">" | "<=" | ">=") expression
  | expression
  ;

select_statement
  : "ΕΠΙΛΕΞΕ" expression nl ("ΠΕΡΙΠΤΩΣΗ" select_case ("," select_case)* nl statement_list)* ("ΠΕΡΙΠΤΩΣΗ" "ΑΛΛΙΩΣ" nl statement_list)? "ΤΕΛΟΣ_ΕΠΙΛΟΓΩΝ"
  ;

type
  : "ΑΚΕΡΑΙΕΣ"
  | "ΠΡΑΓΜΑΤΙΚΕΣ"
  | "ΛΟΓΙΚΕΣ"
  | "ΧΑΡΑΚΤΗΡΕΣ"
  ;

subrange
  : INTEGER ".." INTEGER
  ;

algorithm
  : "\n"* "ΑΛΓΟΡΙΘΜΟΣ" variable nl "ΑΡΧΗ" nl statement_list "ΤΕΛΟΣ" variable nl
  ;

statement_list:
  : statement ("\n" statement)*
  ;

read_statement
  : "ΔΙΑΒΑΣΕ" variable([expression ("," expression)*]) ("," variable([expression ("," expression)*])?)*
  ;

data_statement
  : "ΔΕΔΟΜΕΝΑ" "//" variable([expression ("," expression)*]) ("," variable([expression ("," expression)*])?)* "//"
  ;

write_statement
  : ("ΓΡΑΨΕ"|"ΕΜΦΑΝΙΣΕ"|"ΕΚΤΥΠΩΣΕ") expression ("," expression)*
  ;

results_statement
  : "ΑΠΟΤΕΛΕΣΜΑΤΑ" "//" variable([expression ("," expression)*]) ("," variable([expression ("," expression)*])?)* "//"
  ;

swap_statement
  : "ΑΝΤΙΜΕΤΑΘΕΣΕ" variable([expression ("," expression)*])? "," variable([expression ("," expression)*])?

statement
  : assignment_expression
  | if_statement
  | select_statement
  | for_loop
  | while_loop
  | read_statement
  | data_statement
  | write_statement
  | results_statement
  | swap_statement
  | empty
  ;

assignment_expression
  : (array_access | variable) "<-" expression
  ;

variable
  : [α-ωΑ-Ωa-zA-Z_][α-ωΑ-Ωa-zA-Z0-9_]*
  ;

array_access
  : variable "[" expression ("," expression)* "]"
  ;

variable_or_array_access
  : variable([expression ("," expression)*])
  ;

empty
  :
  ;

expression
  : and ("Η" and)*
  ;

and:
  : not ("ΚΑΙ" not)*
  ;

not
  : "ΟΧΙ"? comparison
  ;

comparison:
  : term (("=" | "<>" | "<" | ">" | "<=" | ">=") term)*
  ;

term
  : factor (("+" | "-") factor)*
  ;

factor
  : power (("*" | "div" | "/" | "MOD") power)*
  ;

power
  : atom ("^" atom)*
  ;

atom
  : INTEGER
  | "+" atom
  | "-" atom
  | "(" expression ")"
  | array_access
  | variable
  | call
  | "ΑΛΗΘΗΣ"
  | "ΨΕΥΔΗΣ"
  | string_expression
  ;