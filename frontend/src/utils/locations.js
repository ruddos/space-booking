// Координаты домов учебных площадок, в порядке [долгота, широта].
// Это метка здания по адресу, а не подтверждённого входа в студию.
export const LOCATIONS = {
  'Ростов-на-Дону, ул. Большая Садовая, 47': [39.712499, 47.221668],
  'Ростов-на-Дону, пр. Будённовский, 49': [39.704664, 47.224930],
  'Ростов-на-Дону, ул. Пушкинская, 36': [39.703529, 47.222510],
  'Ростов-на-Дону, пр. Ворошиловский, 46': [39.716503, 47.228359],
  'Ростов-на-Дону, ул. Социалистическая, 74': [39.712686, 47.219732],
  'Ростов-на-Дону, пр. Михаила Нагибина, 32': [39.719042, 47.260372],
}

// Источники координат доступны для сверки адресов.
export const LOCATION_SOURCES = [
  'https://rostov.wiki/buildings/67727/',
  'https://rostov-gorod.ru/administration/structure/the-municipal-institutions-and-enterprises/ub-len/news/118866/?special_version=N',
  'https://rostov-na-donu.spravka.city/company/gavrosh-28',
  'https://rnd.guidebook.ru/rostov-na-donu/voroshilovskiy/rostovskaya-guberniya.html',
  'https://rnd.guidebook.ru/rostov-na-donu/sotsialisticheskaya/kupecheskiy-dvor.html',
  'https://rnd.guidebook.ru/rostov-na-donu/mihaila-nagibina/professional-informatsionno-izdatelskaya-gruppa.html',
]
