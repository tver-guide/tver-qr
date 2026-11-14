// Каталог страниц с информацией.
// Файл страницы лежит в pages/<slug>.html, адрес для QR-кода — /p/<slug>.
// Название и описание показываются в «Коллекции» после открытия страницы.
const PAGES = [
  {
    slug: 'afanasiy-nikitin',
    title: 'Памятник Афанасию Никитину',
    summary: 'Тверской купец и путешественник на набережной Волги.',
  },
  {
    slug: 'mikhail-krug',
    title: 'Памятник Михаилу Кругу',
    summary: 'Бронзовый шансонье, присевший отдохнуть на обычной скамейке.',
  },
  {
    slug: 'putevoy-dvorets',
    title: 'Путевой дворец',
    summary: 'Остановка императорской семьи на дороге между двумя столицами.',
  },
  {
    slug: 'starovolzhsky-most',
    title: 'Староволжский мост',
    summary: 'Металлические арки, которые сравнивают с мостом Свободы в Будапеште.',
  },
  {
    slug: 'trekhsvyatskaya',
    title: 'Трёхсвятская улица',
    summary: 'Один из старейших уличных маршрутов, «Тверской Арбат».',
  },
  {
    slug: 'rechnoy-vokzal',
    title: 'Речной вокзал',
    summary: 'Здание на слиянии Волги и Тверцы и его будущее.',
  },
].map((p) => ({ ...p, thumb: `/thumbs/${p.slug}.jpg` }));

const bySlug = new Map(PAGES.map((p) => [p.slug, p]));

module.exports = { PAGES, getPage: (slug) => bySlug.get(slug) || null };
