// Ajuda dos blocos da página de sessão.
import type { FilmImage } from '../../data/films';

/** Atributos responsivos de uma imagem: sizes + srcset quando há versões. Espalhar entre alt e class. */
export const responsive = (image: FilmImage | null | undefined, sizes: string) =>
  image?.srcset ? { sizes, srcset: image.srcset } : {};
