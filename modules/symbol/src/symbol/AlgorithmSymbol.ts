import GLOSymbol from './GLOSymbol';

export default class AlgorithmSymbol extends GLOSymbol {
  constructor(name: string) {
    super(name);
  }

  public print() {
    return 'Αλγόριθμος';
  }
}
