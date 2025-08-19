// Типы данных
export interface Author {
    id: string
    name: string
    avatar: string
    role: string
    bio: string
    social?: {
      instagram?: string
      telegram?: string
      website?: string
    }
  }
  
  export interface Category {
    id: string
    name: string
    description: string
    color: string
  }
  
  export interface ContentBlock {
    type: string
    [key: string]: any
  }
  
  export interface BlogPost {
    id: string
    title: string
    slug: string
    excerpt: string
    content: ContentBlock[]
    authorId: string
    publishedAt: string
    updatedAt?: string
    readTime: number
    categoryId: string
    tags: string[]
    image: string
    featured: boolean
    status: "published" | "draft"
    seo?: {
      metaTitle?: string
      metaDescription?: string
      keywords?: string[]
    }
  }
  
  // Авторы
  export const authors: Author[] = [
    {
      id: "anna-petrova",
      name: "Анна Петрова",
      avatar: "/placeholder.svg?height=60&width=60",
      role: "Nail-мастер",
      bio: "Профессиональный nail-мастер с 8-летним опытом. Специализируется на художественной росписи и современных техниках маникюра. Победитель международных конкурсов nail-арта.",
      social: {
        instagram: "@anna_nails_pro",
        telegram: "@anna_petrova_nails",
      },
    },
    {
      id: "maria-ivanova",
      name: "Мария Иванова",
      avatar: "/placeholder.svg?height=60&width=60",
      role: "Стилист-парикмахер",
      bio: "Топ-стилист с 12-летним опытом работы. Эксперт по стрижкам и укладкам. Работала с известными брендами и знаменитостями. Автор собственной методики подбора причесок.",
      social: {
        instagram: "@maria_hair_style",
        website: "mariahair.ru",
      },
    },
    {
      id: "elena-smirnova",
      name: "Елена Смирнова",
      avatar: "/placeholder.svg?height=60&width=60",
      role: "Косметолог",
      bio: "Врач-косметолог высшей категории. Специализируется на anti-age процедурах и уходе за проблемной кожей. 15 лет практики в ведущих клиниках красоты.",
      social: {
        instagram: "@elena_cosmetolog",
        telegram: "@elena_beauty_expert",
      },
    },
    {
      id: "olga-kozlova",
      name: "Ольга Козлова",
      avatar: "/placeholder.svg?height=60&width=60",
      role: "Визажист",
      bio: "Профессиональный визажист и бьюти-блогер. Работает с модными показами, фотосессиями и свадебными образами. Автор популярных мастер-классов по макияжу.",
      social: {
        instagram: "@olga_makeup_pro",
        website: "olgamakeup.com",
      },
    },
    {
      id: "victoria-novikova",
      name: "Виктория Новикова",
      avatar: "/placeholder.svg?height=60&width=60",
      role: "Стилист",
      bio: "Персональный стилист и имидж-консультант. Помогает создавать гармоничные образы для деловых женщин и публичных личностей. Эксперт по цветотипированию.",
      social: {
        instagram: "@victoria_style_guru",
        telegram: "@victoria_stylist",
      },
    },
    {
      id: "darya-volkova",
      name: "Дарья Волкова",
      avatar: "/placeholder.svg?height=60&width=60",
      role: "Колорист",
      bio: "Мастер-колорист международного уровня. Специализируется на сложных техниках окрашивания и восстановлении волос. Амбассадор ведущих профессиональных брендов.",
      social: {
        instagram: "@darya_colorist",
        website: "daryacolor.ru",
      },
    },
  ]
  
  // Категории
  export const categories: Category[] = [
    {
      id: "trends",
      name: "Тренды",
      description: "Последние тенденции в мире красоты и моды",
      color: "rose",
    },
    {
      id: "tutorials",
      name: "Уроки",
      description: "Пошаговые инструкции и мастер-классы",
      color: "pink",
    },
    {
      id: "reviews",
      name: "Обзоры",
      description: "Честные отзывы о косметике и процедурах",
      color: "purple",
    },
    {
      id: "tips",
      name: "Советы",
      description: "Полезные лайфхаки от профессионалов",
      color: "indigo",
    },
    {
      id: "interviews",
      name: "Интервью",
      description: "Беседы с экспертами индустрии красоты",
      color: "blue",
    },
    {
      id: "lifestyle",
      name: "Образ жизни",
      description: "Красота изнутри и здоровые привычки",
      color: "green",
    },
  ]
  
  // Статьи блога
  export const blogPosts: BlogPost[] = [
    {
      id: "nail-trends-2024",
      title: "Топ-10 трендов в маникюре на 2024 год",
      slug: "nail-trends-2024",
      excerpt:
        "Откройте для себя самые актуальные тенденции в nail-арте, которые будут популярны в этом году. От минимализма до ярких акцентов.",
      content: [
        {
          type: "paragraph",
          content:
            "Мир nail-арта постоянно развивается, и 2024 год принес нам множество удивительных трендов. В этой статье мы рассмотрим самые актуальные направления в маникюре, которые покорили сердца модниц по всему миру.",
        },
        {
          type: "heading",
          level: 2,
          content: "1. Минимализм в новом прочтении",
        },
        {
          type: "paragraph",
          content:
            "Простота и элегантность остаются в тренде. Однотонные покрытия в нюдовых оттенках, тонкие линии и геометрические формы создают утонченный образ. Особенно популярны:",
        },
        {
          type: "list",
          items: [
            "Нюдовые оттенки с матовым финишем",
            "Тонкие золотые и серебряные полоски",
            "Негативное пространство в дизайне",
            "Геометрические узоры в пастельных тонах",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "2. Металлические акценты",
        },
        {
          type: "paragraph",
          content:
            "Золотые и серебряные детали добавляют роскоши любому маникюру. Фольга, блестки и металлические полоски - must-have этого сезона. Металлические элементы прекрасно сочетаются с:",
        },
        {
          type: "list",
          items: [
            "Классическими красными оттенками",
            "Глубокими синими и зелеными тонами",
            "Нейтральными бежевыми цветами",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "3. Природные мотивы",
        },
        {
          type: "paragraph",
          content:
            "Цветочные принты, листья и абстрактные природные узоры помогают создать гармоничный образ, близкий к природе. Этот тренд особенно актуален весной и летом.",
        },
        {
          type: "heading",
          level: 2,
          content: "4. Яркие неоновые оттенки",
        },
        {
          type: "paragraph",
          content:
            "Для тех, кто любит выделяться, неоновые цвета станут идеальным выбором. Электрический розовый, ярко-зеленый и кислотный желтый - хиты сезона.",
        },
        {
          type: "heading",
          level: 2,
          content: "5. Текстурные покрытия",
        },
        {
          type: "paragraph",
          content:
            "Матовые, велветовые и песочные текстуры добавляют объем и интерес к маникюру. Особенно эффектно смотрятся в сочетании с глянцевыми элементами.",
        },
        {
          type: "tip",
          title: "Совет эксперта",
          content:
            "При выборе дизайна учитывайте форму ваших ногтей и образ жизни. Сложные узоры лучше смотрятся на длинных ногтях, а минималистичные дизайны универсальны для любой длины.",
          color: "rose",
        },
        {
          type: "paragraph",
          content:
            "Помните, что главное в маникюре - это аккуратность и качество покрытия. Любой тренд будет смотреться великолепно, если выполнен профессионально.",
        },
      ],
      authorId: "anna-petrova",
      publishedAt: "2024-01-15",
      readTime: 5,
      categoryId: "trends",
      tags: ["маникюр", "тренды", "nail-арт", "2024", "дизайн ногтей"],
      image: "/placeholder.svg?height=400&width=800",
      featured: true,
      status: "published",
      seo: {
        metaTitle: "Топ-10 трендов маникюра 2024 | Beauty Platform",
        metaDescription:
          "Узнайте о самых актуальных трендах в nail-арте 2024 года. Минимализм, металлические акценты, природные мотивы и многое другое.",
        keywords: ["маникюр 2024", "тренды nail-арт", "дизайн ногтей", "модный маникюр"],
      },
    },
    {
      id: "perfect-haircut-face-shape",
      title: "Как выбрать идеальную стрижку по форме лица",
      slug: "perfect-haircut-face-shape",
      excerpt:
        "Подробное руководство по выбору стрижки, которая подчеркнет ваши достоинства и скроет недостатки. Советы от профессионального стилиста.",
      content: [
        {
          type: "paragraph",
          content:
            "Правильно подобранная стрижка может кардинально изменить ��аш образ и подчеркнуть природную красоту. В этом руководстве мы разберем, как выбрать идеальную прическу для каждого типа лица.",
        },
        {
          type: "heading",
          level: 2,
          content: "Определяем форму лица",
        },
        {
          type: "paragraph",
          content:
            "Первый шаг к идеальной стрижке - правильное определение формы лица. Встаньте перед зеркалом и уберите волосы с лица, затем обведите контур лица помадой или маркером.",
        },
        {
          type: "heading",
          level: 3,
          content: "Овальное лицо",
        },
        {
          type: "paragraph",
          content: "Считается идеальной формой. Подходят практически все стрижки:",
        },
        {
          type: "list",
          items: [
            "Каре любой длины",
            "Боб с челкой и без",
            "Длинные волосы с лесенкой",
            "Пикси и другие короткие стрижки",
          ],
        },
        {
          type: "heading",
          level: 3,
          content: "Круглое лицо",
        },
        {
          type: "paragraph",
          content: "Цель - визуально удлинить лицо:",
        },
        {
          type: "list",
          items: [
            "Длинное каре с пробором сбоку",
            "Многослойные стрижки с объемом на макушке",
            "Асимметричные челки",
            "Избегайте: прямых челок, коротких стрижек",
          ],
        },
        {
          type: "heading",
          level: 3,
          content: "Квадратное лицо",
        },
        {
          type: "paragraph",
          content: "Смягчаем угловатые черты:",
        },
        {
          type: "list",
          items: [
            "Мягкие волны и локоны",
            "Боб до подбородка",
            "Косые челки",
            "Избегайте: прямых линий, ультракоротких стрижек",
          ],
        },
        {
          type: "tip",
          title: "Важно помнить",
          content:
            "Помимо формы лица, учитывайте структуру волос, образ жизни и личные предпочтения. Консультация с профессиональным стилистом поможет сделать правильный выбор.",
          color: "pink",
        },
        {
          type: "heading",
          level: 2,
          content: "Дополнительные факторы",
        },
        {
          type: "paragraph",
          content: "При выборе стрижки также важно учитывать:",
        },
        {
          type: "list",
          items: [
            "Тип и структуру волос",
            "Возраст и стиль жизни",
            "Время, которое вы готовы тратить на укладку",
            "Особенности внешности (размер лба, форма носа)",
          ],
        },
      ],
      authorId: "maria-ivanova",
      publishedAt: "2024-01-12",
      readTime: 8,
      categoryId: "tutorials",
      tags: ["стрижка", "форма лица", "стиль", "прическа", "парикмахер"],
      image: "/placeholder.svg?height=400&width=800",
      featured: false,
      status: "published",
    },
    {
      id: "skincare-products-review",
      title: "Обзор лучших средств для ухода за кожей зима 2024",
      slug: "skincare-products-review",
      excerpt:
        "Тестируем и сравниваем популярные косметические средства для разных типов кожи. Честные отзывы косметолога о том, что действительно работает.",
      content: [
        {
          type: "paragraph",
          content:
            "Зимний период - особое испытание для нашей кожи. Холодный воздух, отопление и недостаток солнца требуют особого ухода. Я протестировала 15 популярных средств и готова поделиться результатами.",
        },
        {
          type: "heading",
          level: 2,
          content: "Очищение",
        },
        {
          type: "productRating",
          name: "CeraVe Foaming Facial Cleanser",
          rating: "Рейтинг: 9/10",
          description:
            "Отличное средство для жирной и комбинированной кожи. Эффективно очищает, не пересушивает. Содержит церамиды и ниацинамид.",
          color: "green",
        },
        {
          type: "productRating",
          name: "La Roche-Posay Toleriane Caring Wash",
          rating: "Рейтинг: 8/10",
          description:
            "Идеально для чувствительной кожи. Мягко очищает, успокаивает раздражения. Без отдушек и парабенов.",
          color: "green",
        },
        {
          type: "heading",
          level: 2,
          content: "Увлажнение",
        },
        {
          type: "productRating",
          name: "The Ordinary Hyaluronic Acid 2% + B5",
          rating: "Рейтинг: 7/10",
          description:
            "Хорошее соотношение цена-качество. Эффективно увлажняет, но требует правильного применения на влажную кожу.",
          color: "yellow",
        },
        {
          type: "productRating",
          name: "Neutrogena Hydro Boost",
          rating: "Рейтинг: 9/10",
          description:
            "Легкая текстура, быстро впитывается. Подходит для всех типов кожи. Содержит гиалуроновую кислоту.",
          color: "green",
        },
        {
          type: "tip",
          title: "Совет косметолога",
          content:
            "Зимой особенно важно не забывать о SPF защите. Даже в пасмурные дни UV-лучи могут повредить кожу, особенно в сочетании с отражением от снега.",
          color: "rose",
        },
        {
          type: "heading",
          level: 2,
          content: "Антивозрастной уход",
        },
        {
          type: "productRating",
          name: "Retinol 0.5% от Paula's Choice",
          rating: "Рейтинг: 10/10",
          description:
            "Золотой стандарт ретинола. Эффективно борется с признаками старения, выравнивает тон кожи. Начинать с 1-2 раз в неделю.",
          color: "green",
        },
        {
          type: "heading",
          level: 2,
          content: "Итоговые рекомендации",
        },
        {
          type: "paragraph",
          content:
            "Помните, что эффективность средств индивидуальна. Всегда тестируйте новые продукты на небольшом участке кожи и вводите их постепенно в свой уход.",
        },
      ],
      authorId: "elena-smirnova",
      publishedAt: "2024-01-10",
      readTime: 12,
      categoryId: "reviews",
      tags: ["уход за кожей", "косметика", "обзор", "зима", "увлажнение"],
      image: "/placeholder.svg?height=400&width=800",
      featured: true,
      status: "published",
    },
    {
      id: "long-lasting-makeup-secrets",
      title: "5 секретов долговечного макияжа от профессионального визажиста",
      slug: "long-lasting-makeup-secrets",
      excerpt:
        "Профессиональные советы, как сделать макияж стойким на весь день. Техники и продукты, которые используют визажисты на съемках.",
      content: [
        {
          type: "paragraph",
          content:
            "Каждая женщина мечтает о макияже, который выглядит безупречно с утра до вечера. За годы работы визажистом я собрала проверенные техники, которые помогут вашему макияжу продержаться весь день.",
        },
        {
          type: "heading",
          level: 2,
          content: "Секрет №1: Правильная подготовка кожи",
        },
        {
          type: "paragraph",
          content: "Стойкость макияжа на 70% зависит от подготовки:",
        },
        {
          type: "list",
          items: [
            "Очистите кожу мицеллярной водой",
            "Нанесите увлажняющий крем и дайте ему впитаться 5-10 минут",
            "Используйте праймер, подходящий вашему типу кожи",
            "Для жирной кожи - матирующий праймер",
            "Для сухой кожи - увлажняющий праймер",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Секрет №2: Техника нанесения тонального средства",
        },
        {
          type: "paragraph",
          content: "Правильное нанесение - залог стойкости:",
        },
        {
          type: "list",
          items: [
            "Наносите тональное средство тонкими слоями",
            "Используйте влажный бьюти-блендер для растушевки",
            "Закрепите рассыпчатой пудрой в T-зоне",
            "Не забывайте про шею и область декольте",
          ],
        },
        {
          type: "tip",
          title: "Лайфхак от визажиста",
          content:
            'Сбрызните бьюти-блендер фиксирующим спреем перед нанесением тонального средства. Это поможет макияжу лучше "схватиться" с кожей.',
          color: "pink",
        },
        {
          type: "heading",
          level: 2,
          content: "Секрет №3: Водостойкие формулы в ключевых зонах",
        },
        {
          type: "paragraph",
          content: "Используйте водостойкие продукты там, где это критично:",
        },
        {
          type: "list",
          items: [
            "Тушь для ресниц - обязательно водостойкая",
            "Подводка для глаз - гелевая или водостойкая",
            "Помада - стойкая формула или жидкая матовая",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Секрет №4: Техника слоев и закрепления",
        },
        {
          type: "paragraph",
          content: "Правильное наслоение продуктов:",
        },
        {
          type: "steps",
          steps: [
            "Нанесите кремовые продукты (консилер, кремовые тени)",
            "Закрепите пудрой",
            "Нанесите сухие продукты (пудровые тени, румяна)",
            "Завершите фиксирующим спреем",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Секрет №5: Правильные инструменты",
        },
        {
          type: "paragraph",
          content: "Качественные кисти и спонжи - инвестиция в стойкость макияжа:",
        },
        {
          type: "list",
          items: [
            "Плотные синтетические кисти для тонального средства",
            "Влажный бьюти-блендер для растушевки",
            "Пушистые кисти для пудры и румян",
            "Плоские кисти для теней",
          ],
        },
        {
          type: "infoBox",
          title: "Продукты-фавориты",
          items: [
            "Праймер: Smashbox Photo Finish",
            "Тональное средство: Estée Lauder Double Wear",
            "Пудра: Laura Mercier Translucent",
            "Фиксирующий спрей: Urban Decay All Nighter",
          ],
          color: "rose",
        },
        {
          type: "paragraph",
          content:
            "Помните: стойкий макияж - это не только правильные продукты, но и техника нанесения. Практикуйтесь, и вскоре эти приемы войдут в привычку!",
        },
      ],
      authorId: "olga-kozlova",
      publishedAt: "2024-01-08",
      readTime: 6,
      categoryId: "tips",
      tags: ["макияж", "советы", "стойкость", "визаж", "техники"],
      image: "/placeholder.svg?height=400&width=800",
      featured: false,
      status: "published",
    },
    {
      id: "evening-look-tutorial",
      title: "Пошаговый урок: Создание элегантного вечернего образа",
      slug: "evening-look-tutorial",
      excerpt:
        "Детальная инструкция по созданию элегантного вечернего макияжа и прически. От дневного образа к вечернему за 30 минут.",
      content: [
        {
          type: "paragraph",
          content:
            "Вечерний образ требует особого подхода. В этом уроке я покажу, как трансформировать дневной макияж в элегантный вечерний look, который подойдет для любого торжественного мероприятия.",
        },
        {
          type: "heading",
          level: 2,
          content: "Что вам понадобится",
        },
        {
          type: "infoBox",
          title: "Для макияжа:",
          items: [
            "Палетка теней в коричнево-золотых тонах",
            "Черная подводка (гелевая или карандаш)",
            "Тушь для ресниц",
            "Хайлайтер",
            "Помада или блеск насыщенного оттенка",
          ],
          color: "gray",
        },
        {
          type: "infoBox",
          title: "Для прически:",
          items: ["Плойка или утюжок", "Текстурирующий спрей", "Невидимки и шпильки", "Лак для волос"],
          color: "gray",
        },
        {
          type: "heading",
          level: 2,
          content: "Шаг 1: Подготовка базы",
        },
        {
          type: "paragraph",
          content: "Если у вас уже есть дневной макияж:",
        },
        {
          type: "steps",
          steps: [
            "Промокните лицо салфеткой, чтобы убрать излишки жира",
            "Подправьте тональное средство при необходимости",
            "Слегка припудрите T-зону",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Шаг 2: Глаза - главный акцент",
        },
        {
          type: "heading",
          level: 3,
          content: "Тени",
        },
        {
          type: "steps",
          steps: [
            "Нанесите светлый оттенок на все подвижное веко",
            "Средним коричневым оттенком проработайте складку века",
            "Темно-коричневым углубите внешний уголок глаза",
            "Золотистым оттенком выделите центр века",
            "Светлым шиммером подсветите внутренний уголок",
          ],
        },
        {
          type: "heading",
          level: 3,
          content: "Стрелки",
        },
        {
          type: "paragraph",
          content: "Для вечернего образа сделайте стрелки более выразительными:",
        },
        {
          type: "steps",
          steps: [
            "Проведите линию вдоль верхнего века, утолщая к внешнему углу",
            "Создайте небольшую стрелку, направленную к виску",
            "Подведите нижнее веко, соединив с верхней линией",
          ],
        },
        {
          type: "tip",
          title: "Совет стилиста",
          content:
            "Для создания идеальной стрелки используйте скотч как трафарет. Приклейте его под углом от внешнего уголка глаза к концу брови.",
          color: "pink",
        },
        {
          type: "heading",
          level: 2,
          content: "Шаг 3: Ресницы и брови",
        },
        {
          type: "list",
          items: [
            "Завейте ресницы щипчиками",
            "Нанесите 2-3 слоя туши, прокрашивая каждую ресничку",
            "Подчеркните брови тенями или карандашом",
            "Зафиксируйте гелем для бровей",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Шаг 4: Скульптурирование и сияние",
        },
        {
          type: "steps",
          steps: [
            "Нанесите хайлайтер на скулы, спинку носа, центр лба",
            "Подчеркните скулы румянами персикового оттенка",
            "Добавьте немного хайлайтера на ключицы (если открытое декольте)",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Шаг 5: Губы",
        },
        {
          type: "paragraph",
          content: "Для вечернего образа выберите один из вариантов:",
        },
        {
          type: "list",
          items: [
            "Классика: Красная помада с атласным финишем",
            "Современность: Нюдово-розовый глянцевый блеск",
            "Драма: Темно-бордовая матовая помада",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Шаг 6: Прическа",
        },
        {
          type: "heading",
          level: 3,
          content: "Элегантный низкий пучок",
        },
        {
          type: "steps",
          steps: [
            "Создайте легкие волны плойкой",
            "Сделайте боковой пробор",
            "Соберите волосы в низкий хвост на затылке",
            "Скрутите хвост в жгут и оберните вокруг основания",
            "Закрепите шпильками",
            "Выпустите несколько прядей у лица для мягкости",
            "Зафиксируйте лаком",
          ],
        },
        {
          type: "infoBox",
          title: "Финальные штрихи",
          items: [
            "Проверьте макияж при разном освещении",
            "Возьмите с собой помаду для подкрашивания",
            "Не забудьте про аромат - завершающий аккорд образа",
          ],
          color: "rose",
        },
        {
          type: "paragraph",
          content:
            "Помните: вечерний образ должен быть более интенсивным, чем дневной, но при этом гармоничным. Не бойтесь экспериментировать с цветами и текстурами!",
        },
      ],
      authorId: "victoria-novikova",
      publishedAt: "2024-01-05",
      readTime: 15,
      categoryId: "tutorials",
      tags: ["вечерний образ", "макияж", "прическа", "урок", "стиль"],
      image: "/placeholder.svg?height=400&width=800",
      featured: false,
      status: "published",
    },
    {
      id: "hair-color-trends-2024",
      title: "Модные цвета волос весна-лето 2024: тренды от ведущих колористов",
      slug: "hair-color-trends-2024",
      excerpt:
        "Самые актуальные оттенки для окрашивания волос в новом сезоне. Анализ трендов с международных показов мод и советы по выбору цвета.",
      content: [
        {
          type: "paragraph",
          content:
            "Весна-лето 2024 принесли революционные изменения в мир окрашивания волос. Как ведущий колорист, я проанализировала тренды с мировых подиумов и готова поделиться самыми актуальными направлениями сезона.",
        },
        {
          type: "heading",
          level: 2,
          content: "Тренд №1: Медовые оттенки",
        },
        {
          type: "paragraph",
          content: "Теплые медовые тона стали абсолютным хитом сезона:",
        },
        {
          type: "list",
          items: [
            "Золотистый мед - универсальный оттенок для всех типов внешности",
            "Темный мед - идеален для брюнеток, желающих добавить теплоты",
            "Светлый мед - мягкая альтернатива платиновому блонду",
          ],
        },
        {
          type: "infoBox",
          title: "Кому подходит",
          items: [
            "Медовые оттенки особенно выигрышно смотрятся на девушках с теплым цветотипом: карими или зелеными глазами, персиковым или золотистым подтоном кожи.",
          ],
          color: "yellow",
        },
        {
          type: "heading",
          level: 2,
          content: "Тренд №2: Шоколадные глубины",
        },
        {
          type: "paragraph",
          content: "Насыщенные шоколадные оттенки возвращаются в моду:",
        },
        {
          type: "list",
          items: [
            "Молочный шоколад - мягкий и естественный",
            "Горький шоколад - драматичный и элегантный",
            "Шоколад с карамелью - многомерный цвет с бликами",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Тренд №3: Клубничный блонд",
        },
        {
          type: "paragraph",
          content: "Нежное сочетание блонда с розовыми нотками:",
        },
        {
          type: "list",
          items: [
            "Создает романтичный и женственный образ",
            "Подходит для светлой кожи с розовым подтоном",
            "Требует регулярного тонирования для поддержания оттенка",
          ],
        },
        {
          type: "tip",
          title: "Важно знать",
          content:
            "Клубничный блонд - капризный оттенок, который быстро вымывается. Используйте специальные шампуни для окрашенных волос и делайте тонирование каждые 4-6 недель.",
          color: "pink",
        },
        {
          type: "heading",
          level: 2,
          content: 'Тренд №4: Техника "Money Piece"',
        },
        {
          type: "paragraph",
          content: "Осветление передних прядей, обрамляющих лицо:",
        },
        {
          type: "list",
          items: [
            "Создает эффект естественного выгорания",
            "Освежает лицо без кардинальной смены цвета",
            "Подходит для любого базового оттенка",
            "Требует минимального ухода",
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Тренд №5: Пепельные оттенки",
        },
        {
          type: "paragraph",
          content: "Холодные пепельные тона для смелых натур:",
        },
        {
          type: "list",
          items: [
            "Пепельный блонд - ультрамодный и стильный",
            "Пепельно-русый - элегантная альтернатива обычному русому",
            "Серебристый пепел - для самых смелых",
          ],
        },
        {
          type: "infoBox",
          title: "Особенности ухода",
          items: [
            "Пепельные оттенки требуют особого ухода: используйте фиолетовые шампуни 1-2 раза в неделю, чтобы нейтрализовать желтизну.",
          ],
          color: "blue",
        },
        {
          type: "heading",
          level: 2,
          content: "Как выбрать свой оттенок",
        },
        {
          type: "paragraph",
          content: "При выборе цвета волос учитывайте:",
        },
        {
          type: "steps",
          steps: [
            "Цветотип внешности - теплый или холодный",
            "Цвет глаз - некоторые оттенки могут их подчеркнуть",
            "Тон кожи - розовый, желтый или нейтральный подтон",
            "Образ жизни - сколько времени готовы тратить на уход",
            "Состояние волос - поврежденные волосы могут не выдержать сильного осветления",
          ],
        },
        {
          type: "infoBox",
          title: "Рекомендации колориста",
          items: [
            "Всегда делайте тест на аллергию перед окрашиванием",
            "Доверяйте сложное окрашивание только профессионалам",
            "Инвестируйте в качественный уход после окрашивания",
            "Планируйте коррекцию цвета заранее",
          ],
          color: "rose",
        },
        {
          type: "heading",
          level: 2,
          content: "Уход за окрашенными волосами",
        },
        {
          type: "paragraph",
          content: "Чтобы цвет держался дольше:",
        },
        {
          type: "list",
          items: [
            "Используйте шампуни для окрашенных волос",
            "Делайте питательные маски 1-2 раза в неделю",
            "Защищайте волосы от UV-лучей",
            "Избегайте горячей воды при мытье головы",
            "Регулярно подстригайте кончики",
          ],
        },
        {
          type: "paragraph",
          content:
            "Помните: красивый цвет волос - это не только модный оттенок, но и здоровые, ухоженные волосы. Не экономьте на качестве красителей и профессиональном уходе!",
        },
      ],
      authorId: "darya-volkova",
      publishedAt: "2024-01-03",
      readTime: 7,
      categoryId: "trends",
      tags: ["окрашивание", "цвет волос", "тренды", "колористика", "2024"],
      image: "/placeholder.svg?height=400&width=800",
      featured: true,
      status: "published",
    },
  ]
  
  // Вспомогательные функции
  export const getAuthorById = (id: string): Author | undefined => {
    return authors.find((author) => author.id === id)
  }
  
  export const getCategoryById = (id: string): Category | undefined => {
    return categories.find((category) => category.id === id)
  }
  
  export const getPostById = (id: string): BlogPost | undefined => {
    return blogPosts.find((post) => post.id === id)
  }
  
  export const getPostBySlug = (slug: string): BlogPost | undefined => {
    return blogPosts.find((post) => post.slug === slug)
  }
  
  export const getFeaturedPosts = (): BlogPost[] => {
    return blogPosts.filter((post) => post.featured && post.status === "published")
  }
  
  export const getPostsByCategory = (categoryId: string): BlogPost[] => {
    if (categoryId === "all") {
      return blogPosts.filter((post) => post.status === "published")
    }
    return blogPosts.filter((post) => post.categoryId === categoryId && post.status === "published")
  }
  
  export const getPostsByTag = (tag: string): BlogPost[] => {
    return blogPosts.filter((post) => post.tags.includes(tag) && post.status === "published")
  }
  
  export const searchPosts = (query: string): BlogPost[] => {
    const lowercaseQuery = query.toLowerCase()
    return blogPosts.filter(
      (post) =>
        post.status === "published" &&
        (post.title.toLowerCase().includes(lowercaseQuery) ||
          post.excerpt.toLowerCase().includes(lowercaseQuery) ||
          post.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))),
    )
  }
  
  export const getRelatedPosts = (postId: string, limit = 3): BlogPost[] => {
    const currentPost = getPostById(postId)
    if (!currentPost) return []
  
    const relatedPosts = blogPosts.filter(
      (post) =>
        post.id !== postId &&
        post.status === "published" &&
        (post.categoryId === currentPost.categoryId || post.tags.some((tag) => currentPost.tags.includes(tag))),
    )
  
    return relatedPosts.slice(0, limit)
  }
  
  // Статистика
  export const getBlogStats = () => {
    const publishedPosts = blogPosts.filter((post) => post.status === "published")
  
    return {
      totalPosts: publishedPosts.length,
      categoriesCount: categories.length,
      authorsCount: authors.length,
    }
  }
  