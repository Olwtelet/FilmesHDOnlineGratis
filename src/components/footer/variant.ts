// As variantes de componente do Webflow somam uma classe gerada a cada elemento estilizado da instância. Na variante
// "on-black" do rodapé essa classe vem logo depois das classes base do elemento e antes das utilitárias, por exemplo
// "line full <variante> contact top".

export const ON_BLACK_CLASS = 'w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874';

/** cls('ft-small-lk', onBlack, 'w-inline-block') -> "ft-small-lk [w-variant-…] w-inline-block" */
export function cls(base: string, onBlack: boolean, rest?: string): string {
  return [base, onBlack ? ON_BLACK_CLASS : '', rest ?? ''].filter(Boolean).join(' ');
}
